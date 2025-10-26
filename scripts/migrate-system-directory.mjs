#!/usr/bin/env node

/**
 * Migrate Vercel Blob System Directory
 *
 * Moves files from 'stories/system/' to 'system/' in Vercel Blob storage.
 * This places system resources (like placeholders) at the same level as 'stories/'.
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/migrate-system-directory.mjs [--dry-run] [--delete-old]
 *
 * Options:
 *   --dry-run: Preview migration without making changes
 *   --delete-old: Delete old files after successful migration (default: keep old files)
 */

import { list, put, del } from '@vercel/blob';

const DRY_RUN = process.argv.includes('--dry-run');
const DELETE_OLD = process.argv.includes('--delete-old');

async function main() {
  console.log('🚀 Starting Vercel Blob system directory migration...\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  if (DELETE_OLD && !DRY_RUN) {
    console.log('🗑️  DELETE MODE - Old files will be removed after migration\n');
  }

  try {
    // Step 1: List all files in stories/system/
    console.log('📋 Step 1: Listing files in stories/system/...\n');

    const { blobs } = await list({
      prefix: 'stories/system/',
    });

    if (blobs.length === 0) {
      console.log('✅ No files found in stories/system/ - migration may already be complete');
      return;
    }

    console.log(`Found ${blobs.length} file(s) to migrate:\n`);

    blobs.forEach((blob, index) => {
      console.log(`${index + 1}. ${blob.pathname}`);
      console.log(`   Size: ${(blob.size / 1024).toFixed(2)} KB`);
      console.log(`   URL: ${blob.url}`);
      console.log('');
    });

    // Step 2: Download and re-upload to new location
    console.log('\n📦 Step 2: Migrating files...\n');

    const migrationResults = [];

    for (const blob of blobs) {
      const oldPath = blob.pathname;
      const newPath = oldPath.replace('stories/system/', 'system/');

      console.log(`⏳ Migrating: ${oldPath} → ${newPath}`);

      try {
        if (!DRY_RUN) {
          // Download the file
          const response = await fetch(blob.url);
          if (!response.ok) {
            throw new Error(`Failed to download: ${response.statusText}`);
          }

          const buffer = await response.arrayBuffer();

          // Determine content type
          const contentType = blob.contentType || 'image/png';

          // Upload to new location
          const newBlob = await put(newPath, buffer, {
            access: 'public',
            contentType: contentType,
            addRandomSuffix: false, // Keep exact filename
          });

          console.log(`   ✅ Uploaded to: ${newBlob.url}`);

          migrationResults.push({
            oldPath,
            newPath,
            oldUrl: blob.url,
            newUrl: newBlob.url,
            size: blob.size,
            status: 'success',
          });
        } else {
          console.log(`   🔍 Would upload to: ${newPath}`);

          migrationResults.push({
            oldPath,
            newPath,
            oldUrl: blob.url,
            newUrl: `(dry run - not created)`,
            size: blob.size,
            status: 'dry-run',
          });
        }
      } catch (error) {
        console.error(`   ❌ Error migrating ${oldPath}:`, error.message);

        migrationResults.push({
          oldPath,
          newPath,
          oldUrl: blob.url,
          newUrl: null,
          size: blob.size,
          status: 'failed',
          error: error.message,
        });
      }

      console.log('');
    }

    // Step 3: Verify new files exist
    console.log('\n🔍 Step 3: Verifying migration...\n');

    const { blobs: newBlobs } = await list({
      prefix: 'system/',
    });

    console.log(`Found ${newBlobs.length} file(s) in new location (system/):\n`);

    newBlobs.forEach((blob, index) => {
      console.log(`${index + 1}. ${blob.pathname}`);
      console.log(`   URL: ${blob.url}`);
      console.log(`   Size: ${(blob.size / 1024).toFixed(2)} KB`);
      console.log('');
    });

    // Step 4: Delete old files (if requested)
    if (DELETE_OLD && !DRY_RUN) {
      console.log('\n🗑️  Step 4: Deleting old files...\n');

      const successfulMigrations = migrationResults.filter(r => r.status === 'success');

      for (const result of successfulMigrations) {
        try {
          console.log(`⏳ Deleting: ${result.oldPath}`);
          await del(result.oldUrl);
          console.log(`   ✅ Deleted\n`);
        } catch (error) {
          console.error(`   ❌ Error deleting ${result.oldPath}:`, error.message);
        }
      }
    } else if (DELETE_OLD && DRY_RUN) {
      console.log('\n🔍 Step 4: Would delete old files (skipped in dry-run mode)\n');
    } else {
      console.log('\n📌 Step 4: Keeping old files (use --delete-old to remove them)\n');
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 Migration Summary');
    console.log('='.repeat(80));

    const successful = migrationResults.filter(r => r.status === 'success').length;
    const failed = migrationResults.filter(r => r.status === 'failed').length;
    const dryRun = migrationResults.filter(r => r.status === 'dry-run').length;

    console.log(`Total files: ${migrationResults.length}`);
    if (DRY_RUN) {
      console.log(`Dry run: ${dryRun}`);
    } else {
      console.log(`✅ Successful: ${successful}`);
      console.log(`❌ Failed: ${failed}`);
    }

    console.log('\n📋 Migrated Files:');
    console.log('─'.repeat(80));

    migrationResults.forEach(result => {
      const status = result.status === 'success' ? '✅' :
                    result.status === 'failed' ? '❌' : '🔍';
      console.log(`${status} ${result.oldPath}`);
      console.log(`   → ${result.newPath}`);
      if (result.newUrl) {
        console.log(`   New URL: ${result.newUrl}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });

    console.log('─'.repeat(80));

    if (DRY_RUN) {
      console.log('\n💡 Run without --dry-run to perform actual migration');
    } else if (!DELETE_OLD) {
      console.log('\n💡 Run with --delete-old to remove old files after migration');
    } else {
      console.log('\n✅ Migration complete! Old files have been removed.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

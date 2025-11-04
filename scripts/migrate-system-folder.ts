/**
 * Migrate System Folder to Multi-Environment Structure
 *
 * Copies system/ folder contents to main/system/ and develop/system/,
 * then optionally removes the legacy system/ folder.
 *
 * Usage:
 *   pnpm exec tsx scripts/migrate-system-folder.ts [--dry-run] [--confirm-delete]
 *
 * Options:
 *   --dry-run         - Show what would be copied/deleted without making changes
 *   --confirm-delete  - Delete legacy system/ folder after successful copy
 */

import { list, copy, del } from '@vercel/blob';
import { getSystemPlaceholderPath } from '../src/lib/utils/blob-path';

interface MigrationStats {
  found: number;
  copied: number;
  deleted: number;
  errors: string[];
}

async function migrateSystemFolder(
  dryRun: boolean = false,
  confirmDelete: boolean = false
): Promise<void> {
  console.log('\n🔄 System Folder Migration to Multi-Environment Structure\n');
  console.log('=' .repeat(70));

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No actual changes will be made\n');
  }

  const stats: MigrationStats = {
    found: 0,
    copied: 0,
    deleted: 0,
    errors: [],
  };

  try {
    // Step 1: List all files in legacy system/ folder
    console.log('\n📋 Step 1: Listing files in legacy system/ folder...\n');

    let cursor: string | undefined;
    const legacyFiles: Array<{ url: string; pathname: string }> = [];

    do {
      const result = await list({
        prefix: 'system/',
        cursor,
        limit: 100,
      });

      for (const blob of result.blobs) {
        legacyFiles.push({
          url: blob.url,
          pathname: blob.pathname,
        });
        stats.found++;
        console.log(`   Found: ${blob.pathname}`);
      }

      cursor = result.cursor;
    } while (cursor);

    if (stats.found === 0) {
      console.log('\n⚠️  No files found in legacy system/ folder');
      console.log('   Either migration already completed or folder is empty\n');
      return;
    }

    console.log(`\n   ✓ Found ${stats.found} files in legacy system/ folder\n`);

    // Step 2: Copy to main/system/ and develop/system/
    console.log('📦 Step 2: Copying files to main/system/ and develop/system/...\n');

    for (const file of legacyFiles) {
      const relativePath = file.pathname.replace(/^system\//, '');

      // Copy to main environment
      const mainPath = `main/system/${relativePath}`;
      console.log(`   Copying: ${file.pathname}`);
      console.log(`        → ${mainPath}`);

      if (!dryRun) {
        try {
          await copy(file.url, mainPath, {
            access: 'public',
            addRandomSuffix: false,
          });
          stats.copied++;
        } catch (error) {
          const errorMsg = `Failed to copy to ${mainPath}: ${error instanceof Error ? error.message : String(error)}`;
          console.error(`   ✗ ${errorMsg}`);
          stats.errors.push(errorMsg);
        }
      } else {
        stats.copied++;
      }

      // Copy to develop environment
      const developPath = `develop/system/${relativePath}`;
      console.log(`        → ${developPath}`);

      if (!dryRun) {
        try {
          await copy(file.url, developPath, {
            access: 'public',
            addRandomSuffix: false,
          });
          stats.copied++;
        } catch (error) {
          const errorMsg = `Failed to copy to ${developPath}: ${error instanceof Error ? error.message : String(error)}`;
          console.error(`   ✗ ${errorMsg}`);
          stats.errors.push(errorMsg);
        }
      } else {
        stats.copied++;
      }

      console.log('');
    }

    console.log(`   ✓ Copied ${stats.copied} files (${stats.copied / 2} files × 2 environments)\n`);

    // Step 3: Delete legacy system/ folder (optional)
    if (confirmDelete) {
      console.log('🗑️  Step 3: Deleting legacy system/ folder...\n');

      if (!dryRun) {
        const urls = legacyFiles.map((f) => f.url);
        try {
          await del(urls);
          stats.deleted = urls.length;
          console.log(`   ✓ Deleted ${stats.deleted} files from legacy system/ folder\n`);
        } catch (error) {
          const errorMsg = `Failed to delete legacy files: ${error instanceof Error ? error.message : String(error)}`;
          console.error(`   ✗ ${errorMsg}`);
          stats.errors.push(errorMsg);
        }
      } else {
        stats.deleted = legacyFiles.length;
        console.log(`   Would delete ${stats.deleted} files from legacy system/ folder\n`);
      }
    } else {
      console.log('⚠️  Step 3: Skipped deletion of legacy system/ folder');
      console.log('   (Use --confirm-delete flag to remove legacy folder)\n');
    }

    // Summary
    console.log('=' .repeat(70));
    console.log('\n📊 Migration Summary:\n');
    console.log(`   Files found:        ${stats.found}`);
    console.log(`   Files copied:       ${stats.copied} (to both main/ and develop/)`);
    console.log(`   Files deleted:      ${stats.deleted}`);
    console.log(`   Errors:             ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:\n');
      stats.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }

    if (!dryRun && stats.errors.length === 0) {
      console.log('\n✅ Migration completed successfully!\n');
      console.log('Next steps:');
      console.log('1. Update code to use getSystemPlaceholderPath() from blob-path.ts');
      console.log('2. Update documentation to reflect new structure');
      console.log('3. Test placeholder images in both environments');
      if (!confirmDelete) {
        console.log('4. Re-run with --confirm-delete to remove legacy system/ folder\n');
      }
    } else if (dryRun) {
      console.log('\n✓ Dry run completed - No changes made\n');
      console.log('To execute migration:');
      console.log('  pnpm exec tsx scripts/migrate-system-folder.ts\n');
      console.log('To execute migration and delete legacy folder:');
      console.log('  pnpm exec tsx scripts/migrate-system-folder.ts --confirm-delete\n');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Parse command-line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const confirmDelete = args.includes('--confirm-delete');

// Run migration
migrateSystemFolder(dryRun, confirmDelete).catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

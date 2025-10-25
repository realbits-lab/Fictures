#!/usr/bin/env node

/**
 * Cleanup Story Blobs
 * Removes all Vercel Blob images for a specific story
 */

import { list, del } from '@vercel/blob';

async function main() {
  const storyId = process.argv[2];
  const dryRun = process.argv.includes('--dry-run');

  if (!storyId) {
    console.error('❌ Usage: node scripts/cleanup-story-blobs.mjs STORY_ID [--dry-run]');
    process.exit(1);
  }

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No actual deletions will occur\n');
  }

  try {
    console.log(`🔍 Finding blobs for story: ${storyId}...\n`);

    const prefix = `stories/${storyId}/`;
    const { blobs } = await list({ prefix });

    if (blobs.length === 0) {
      console.log('📦 No blobs found for this story.');
      return;
    }

    const totalSize = blobs.reduce((sum, b) => sum + b.size, 0);
    console.log(`📦 Found ${blobs.length} blob(s) (${(totalSize / 1024 / 1024).toFixed(2)} MB):\n`);

    blobs.forEach((blob, index) => {
      console.log(`${index + 1}. ${blob.pathname}`);
      console.log(`   Size: ${(blob.size / 1024).toFixed(2)} KB`);
      console.log(`   Uploaded: ${new Date(blob.uploadedAt).toLocaleString()}`);
      console.log('');
    });

    if (dryRun) {
      console.log('🔍 [DRY RUN] Would delete these blobs.');
      return;
    }

    console.log('⚠️  This will permanently delete all these blobs.');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to proceed...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🗑️  Deleting blobs...\n');

    let deleted = 0;
    let failed = 0;

    for (const blob of blobs) {
      try {
        await del(blob.url);
        deleted++;
        console.log(`   ✓ Deleted: ${blob.pathname}`);
      } catch (error) {
        failed++;
        console.error(`   ✗ Failed to delete: ${blob.pathname} (${error.message})`);
      }
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Deleted: ${deleted}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total space freed: ${(blobs.slice(0, deleted).reduce((sum, b) => sum + b.size, 0) / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

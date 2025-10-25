#!/usr/bin/env node

/**
 * Verify Blob Cleanup Script
 *
 * Checks if all story-related blob files have been removed
 */

import { list } from '@vercel/blob';

console.log('🔍 Verifying blob cleanup...\n');

try {
  // List all blobs with 'stories/' prefix
  const { blobs } = await list({ prefix: 'stories/' });

  console.log(`Found ${blobs.length} blob files with 'stories/' prefix`);

  if (blobs.length > 0) {
    console.log('\n⚠️  Remaining orphaned files:');
    for (const blob of blobs) {
      console.log(`   - ${blob.pathname}`);
    }
  } else {
    console.log('\n✅ No orphaned blob files found - cleanup complete!');
  }

} catch (error) {
  console.error('\n❌ Error during verification:', error.message);
  process.exit(1);
}

#!/usr/bin/env npx tsx
/**
 * Script to clear all stories from Vercel Blob storage
 */

import { list, del } from '@vercel/blob';

async function clearVercelBlob() {
  console.log('🗑️ Starting Vercel Blob cleanup...');
  console.log('=' .repeat(80));

  try {
    // List all blobs in the stories folder
    console.log('\n📂 Fetching blob list...');
    const response = await list({
      prefix: 'stories/',
    });

    if (response.blobs.length === 0) {
      console.log('   No story images found in Vercel Blob storage.');
      return;
    }

    console.log(`   Found ${response.blobs.length} story images to delete`);

    // Delete each blob
    console.log('\n🗑️ Deleting blobs...');
    let deletedCount = 0;

    for (const blob of response.blobs) {
      try {
        await del(blob.url);
        deletedCount++;

        // Show progress every 10 items
        if (deletedCount % 10 === 0) {
          console.log(`   Deleted ${deletedCount}/${response.blobs.length} images...`);
        }
      } catch (error) {
        console.error(`   Failed to delete blob: ${blob.pathname}`);
      }
    }

    console.log(`\n   Total deleted: ${deletedCount}/${response.blobs.length} images`);

    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    const verifyResponse = await list({
      prefix: 'stories/',
    });

    if (verifyResponse.blobs.length === 0) {
      console.log('   ✅ All story images successfully removed!');
    } else {
      console.log(`   ⚠️ ${verifyResponse.blobs.length} images still remain`);
    }

    console.log('\n' + '=' .repeat(80));
    console.log('✅ Vercel Blob cleanup complete!');

  } catch (error) {
    console.error('\n❌ Error clearing Vercel Blob:', error);
    process.exit(1);
  }
}

// Run the cleanup
clearVercelBlob().catch(console.error);
#!/usr/bin/env node

/**
 * List Vercel Blob Storage
 * Lists all blobs in Vercel Blob storage
 */

import { list } from '@vercel/blob';

async function main() {
  const prefix = process.argv[2];

  try {
    console.log('🔍 Listing Vercel Blob storage...\n');

    const { blobs } = await list({
      prefix: prefix || undefined,
    });

    if (blobs.length === 0) {
      console.log('No blobs found.');
      return;
    }

    console.log(`Found ${blobs.length} blob(s):\n`);

    blobs.forEach((blob, index) => {
      console.log(`${index + 1}. ${blob.pathname}`);
      console.log(`   URL: ${blob.url}`);
      console.log(`   Size: ${(blob.size / 1024).toFixed(2)} KB`);
      console.log(`   Uploaded: ${new Date(blob.uploadedAt).toLocaleString()}`);
      console.log('');
    });

    // Group by story ID
    const byStory = {};
    blobs.forEach(blob => {
      const match = blob.pathname.match(/^stories\/([^/]+)\//);
      if (match) {
        const storyId = match[1];
        if (!byStory[storyId]) {
          byStory[storyId] = [];
        }
        byStory[storyId].push(blob);
      }
    });

    console.log('\n📊 Blobs by Story:\n');
    Object.entries(byStory).forEach(([storyId, storyBlobs]) => {
      console.log(`Story ID: ${storyId}`);
      console.log(`  Blobs: ${storyBlobs.length}`);
      console.log(`  Total size: ${(storyBlobs.reduce((sum, b) => sum + b.size, 0) / 1024).toFixed(2)} KB`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

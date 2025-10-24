#!/usr/bin/env node

import { config } from 'dotenv';
import { list } from '@vercel/blob';

// Load environment variables
config({ path: '.env.local' });

async function checkBlobStorage() {
  try {
    console.log('🔍 Checking Vercel Blob storage for generated images...\n');

    // List all blobs
    const response = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`📦 Total blobs in storage: ${response.blobs.length}\n`);

    // Filter for story-related images
    const storyBlobs = response.blobs.filter(blob =>
      blob.pathname.includes('story') ||
      blob.pathname.includes('character') ||
      blob.pathname.includes('setting') ||
      blob.pathname.includes('scene') ||
      blob.pathname.includes('KVpJmngygLIRgf7RfFOc1') // The generated story ID
    );

    console.log(`🎨 Story-related images: ${storyBlobs.length}`);
    console.log('================================\n');

    if (storyBlobs.length > 0) {
      storyBlobs.forEach((blob, index) => {
        console.log(`Image ${index + 1}:`);
        console.log(`  Path: ${blob.pathname}`);
        console.log(`  URL: ${blob.url}`);
        console.log(`  Size: ${(blob.size / 1024).toFixed(2)} KB`);
        console.log(`  Uploaded: ${new Date(blob.uploadedAt).toLocaleString()}`);
        console.log('---');
      });
    } else {
      console.log('No story-related images found in Vercel Blob storage.');
      console.log('\nNote: Images are typically generated when stories are');
      console.log('processed through the HNS (Hierarchical Narrative Structure)');
      console.log('generation pipeline, which includes image prompts for');
      console.log('characters and settings.');
    }

    // Show recent uploads (last 10)
    console.log('\n📅 Recent uploads (last 10):');
    console.log('=============================');
    const recentBlobs = response.blobs
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 10);

    recentBlobs.forEach(blob => {
      console.log(`${blob.pathname}`);
      console.log(`  Uploaded: ${new Date(blob.uploadedAt).toLocaleString()}`);
      console.log(`  Size: ${(blob.size / 1024).toFixed(2)} KB`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking Blob storage:', error);
    console.log('\nMake sure BLOB_READ_WRITE_TOKEN is set in .env.local');
    process.exit(1);
  }
}

checkBlobStorage();
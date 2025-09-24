#!/usr/bin/env node

import { list, del } from '@vercel/blob';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

console.log('🧹 Starting Vercel Blob cleanup...');

try {
  // List all blobs
  const { blobs } = await list();

  if (blobs.length === 0) {
    console.log('✅ No blobs found in storage');
  } else {
    console.log(`Found ${blobs.length} blob(s) to delete`);

    // Delete each blob
    for (const blob of blobs) {
      try {
        await del(blob.url);
        console.log(`✅ Deleted: ${blob.pathname}`);
      } catch (error) {
        console.error(`❌ Failed to delete ${blob.pathname}:`, error.message);
      }
    }

    console.log('✅ All blobs cleaned up');
  }
} catch (error) {
  console.error('❌ Error cleaning Vercel Blob storage:', error);
  process.exit(1);
}
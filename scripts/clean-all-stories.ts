#!/usr/bin/env tsx

import { config } from 'dotenv';
import { db } from '../src/lib/db';
import { stories, parts, chapters, scenes, characters, places, settings, communityPosts } from '../src/lib/db/schema';
import { list, del } from '@vercel/blob';

// Load environment variables
config({ path: '.env.local' });

async function cleanAllStories() {
  console.log('🧹 Starting complete story cleanup...\n');

  try {
    // Get all story IDs first (for blob cleanup)
    console.log('📊 Fetching all stories...');
    const allStories = await db.select().from(stories);
    console.log(`Found ${allStories.length} stories to delete\n`);

    // Delete in correct order to respect foreign key constraints
    console.log('🗑️ Deleting database records...');

    // Helper function to safely delete from table
    async function safeDelete(table: any, tableName: string) {
      try {
        await db.delete(table);
        console.log(`  ✓ Deleted ${tableName}`);
      } catch (error: any) {
        if (error.cause?.code === '42P01' || error.message?.includes('does not exist')) {
          console.log(`  ⚠️ Table ${tableName} does not exist, skipping...`);
        } else {
          console.log(`  ❌ Error deleting ${tableName}:`, error.message);
        }
      }
    }

    // Delete in order
    await safeDelete(communityPosts, 'community posts');
    await safeDelete(scenes, 'scenes');
    await safeDelete(chapters, 'chapters');
    await safeDelete(parts, 'parts');
    await safeDelete(characters, 'characters');
    await safeDelete(places, 'places');
    await safeDelete(settings, 'settings');
    await safeDelete(stories, 'stories');

    console.log(`\n✓ Deleted ${allStories.length} stories and related data`);

    // Clean up Vercel Blob storage
    console.log('🗂️ Cleaning Vercel Blob storage...');

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        // List all blobs
        const { blobs } = await list({
          token: process.env.BLOB_READ_WRITE_TOKEN
        });

        console.log(`Found ${blobs.length} blobs in storage`);

        // Filter story-related blobs
        const storyBlobs = blobs.filter(blob =>
          blob.pathname.includes('/stories/') ||
          blob.pathname.includes('/story/')
        );

        console.log(`Found ${storyBlobs.length} story-related blobs`);

        // Delete each blob
        for (const blob of storyBlobs) {
          try {
            await del(blob.url, {
              token: process.env.BLOB_READ_WRITE_TOKEN
            });
            console.log(`  ✓ Deleted: ${blob.pathname}`);
          } catch (error: any) {
            console.error(`  ✗ Failed to delete ${blob.pathname}:`, error.message);
          }
        }

        console.log(`\n✅ Blob storage cleanup complete`);
      } catch (error: any) {
        console.error('⚠️ Blob storage cleanup failed:', error.message);
        console.log('Continuing anyway...\n');
      }
    } else {
      console.log('⚠️ BLOB_READ_WRITE_TOKEN not found, skipping blob cleanup\n');
    }

    // Verify cleanup
    console.log('🔍 Verifying cleanup...');
    const remainingStories = await db.select().from(stories);
    const remainingChapters = await db.select().from(chapters);
    const remainingCharacters = await db.select().from(characters);

    console.log(`  Stories remaining: ${remainingStories.length}`);
    console.log(`  Chapters remaining: ${remainingChapters.length}`);
    console.log(`  Characters remaining: ${remainingCharacters.length}`);

    console.log('\n✨ All stories and related data have been deleted successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanAllStories()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
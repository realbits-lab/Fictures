#!/usr/bin/env node

import { config } from 'dotenv';
import pkg from '../node_modules/@neondatabase/serverless/index.mjs';
const { neon } = pkg;
import { list, del } from '@vercel/blob';

// Load environment variables
config({ path: '.env.local' });

async function cleanAllStories() {
  console.log('🧹 Starting complete story cleanup...\n');

  try {
    // Connect to database
    const sql = neon(process.env.POSTGRES_URL);

    // Get all story IDs first (for blob cleanup)
    console.log('📊 Fetching all stories...');
    const allStories = await sql`SELECT id, title FROM stories`;
    console.log(`Found ${allStories.length} stories to delete\n`);

    // Delete in correct order to respect foreign key constraints
    console.log('🗑️ Deleting database records...');

    // 1. Delete community posts
    const communityResult = await sql`DELETE FROM community_posts RETURNING id`;
    console.log(`  ✓ Deleted ${communityResult.length} community posts`);

    // 2. Delete community replies
    const repliesResult = await sql`DELETE FROM community_replies RETURNING id`;
    console.log(`  ✓ Deleted ${repliesResult.length} community replies`);

    // 3. Delete scenes
    const scenesResult = await sql`DELETE FROM scenes RETURNING id`;
    console.log(`  ✓ Deleted ${scenesResult.length} scenes`);

    // 4. Delete chapters
    const chaptersResult = await sql`DELETE FROM chapters RETURNING id`;
    console.log(`  ✓ Deleted ${chaptersResult.length} chapters`);

    // 5. Delete parts
    const partsResult = await sql`DELETE FROM parts RETURNING id`;
    console.log(`  ✓ Deleted ${partsResult.length} parts`);

    // 6. Delete characters
    const charactersResult = await sql`DELETE FROM characters RETURNING id`;
    console.log(`  ✓ Deleted ${charactersResult.length} characters`);

    // 7. Delete places
    const placesResult = await sql`DELETE FROM places RETURNING id`;
    console.log(`  ✓ Deleted ${placesResult.length} places`);

    // 8. Delete settings
    const settingsResult = await sql`DELETE FROM settings RETURNING id`;
    console.log(`  ✓ Deleted ${settingsResult.length} settings`);

    // 9. Finally delete stories
    const storiesResult = await sql`DELETE FROM stories RETURNING id, title`;
    console.log(`  ✓ Deleted ${storiesResult.length} stories\n`);

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
          } catch (error) {
            console.error(`  ✗ Failed to delete ${blob.pathname}:`, error.message);
          }
        }

        console.log(`\n✅ Blob storage cleanup complete`);
      } catch (error) {
        console.error('⚠️ Blob storage cleanup failed:', error.message);
        console.log('Continuing anyway...\n');
      }
    } else {
      console.log('⚠️ BLOB_READ_WRITE_TOKEN not found, skipping blob cleanup\n');
    }

    // Verify cleanup
    console.log('🔍 Verifying cleanup...');
    const remainingStories = await sql`SELECT COUNT(*) as count FROM stories`;
    const remainingChapters = await sql`SELECT COUNT(*) as count FROM chapters`;
    const remainingCharacters = await sql`SELECT COUNT(*) as count FROM characters`;

    console.log(`  Stories remaining: ${remainingStories[0].count}`);
    console.log(`  Chapters remaining: ${remainingChapters[0].count}`);
    console.log(`  Characters remaining: ${remainingCharacters[0].count}`);

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
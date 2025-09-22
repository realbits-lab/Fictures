#!/usr/bin/env node

import { config } from 'dotenv';
import postgres from 'postgres';
import { list, del } from '@vercel/blob';

// Load environment variables
config({ path: '.env.local' });

async function deleteFromBlobStorage(storyIds) {
  try {
    console.log('\n🗑️  Cleaning up Vercel Blob storage...');

    // List all blobs
    const response = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`   Total blobs found: ${response.blobs.length}`);

    // Filter blobs related to stories
    const storyBlobs = response.blobs.filter(blob => {
      // Check if pathname contains any story ID
      const isStoryRelated = storyIds.some(story =>
        blob.pathname.includes(story.id)
      );

      // Also check for general story-related paths
      const hasStoryKeywords =
        blob.pathname.includes('story') ||
        blob.pathname.includes('character') ||
        blob.pathname.includes('setting') ||
        blob.pathname.includes('scene') ||
        blob.pathname.includes('chapter');

      return isStoryRelated || hasStoryKeywords;
    });

    console.log(`   Story-related blobs to delete: ${storyBlobs.length}`);

    // Delete each blob
    for (const blob of storyBlobs) {
      try {
        await del(blob.url, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        console.log(`   ✅ Deleted: ${blob.pathname}`);
      } catch (error) {
        console.log(`   ⚠️  Failed to delete: ${blob.pathname}`);
      }
    }

    console.log('   ✅ Blob storage cleanup completed!');
    return storyBlobs.length;

  } catch (error) {
    console.error('   ⚠️  Blob storage cleanup failed:', error.message);
    return 0;
  }
}

async function deleteAllStories() {
  const sql = postgres(process.env.POSTGRES_URL);

  try {
    console.log('🗑️  Starting complete story deletion...\n');

    // Show current counts
    console.log('📊 Current database state:');
    const counts = await Promise.all([
      sql`SELECT COUNT(*) FROM stories`.then(r => ({ table: 'stories', count: r[0].count })),
      sql`SELECT COUNT(*) FROM characters`.then(r => ({ table: 'characters', count: r[0].count })),
      sql`SELECT COUNT(*) FROM settings`.then(r => ({ table: 'settings', count: r[0].count })),
      sql`SELECT COUNT(*) FROM parts`.then(r => ({ table: 'parts', count: r[0].count })),
      sql`SELECT COUNT(*) FROM chapters`.then(r => ({ table: 'chapters', count: r[0].count })),
      sql`SELECT COUNT(*) FROM scenes`.then(r => ({ table: 'scenes', count: r[0].count })),
      sql`SELECT COUNT(*) FROM ai_interactions`.then(r => ({ table: 'ai_interactions', count: r[0].count })),
    ]);

    counts.forEach(({ table, count }) => {
      console.log(`   ${table}: ${count} records`);
    });

    // Get story IDs for Blob cleanup
    const storyIds = await sql`SELECT id, title FROM stories`;

    if (storyIds.length > 0) {
      console.log('\n📚 Stories to delete:');
      storyIds.forEach(story => {
        console.log(`   - ${story.title} (${story.id})`);
      });

      // Clean up Blob storage first
      const blobsDeleted = await deleteFromBlobStorage(storyIds);
      console.log(`   Deleted ${blobsDeleted} blobs from storage`);
    }

    // Delete in correct order to handle foreign key constraints
    console.log('\n🔥 Deleting all data from database...');

    // Delete dependent tables first
    const scenesDeleted = await sql`DELETE FROM scenes`;
    console.log(`   ✅ Deleted ${scenesDeleted.count} scenes`);

    const chaptersDeleted = await sql`DELETE FROM chapters`;
    console.log(`   ✅ Deleted ${chaptersDeleted.count} chapters`);

    const partsDeleted = await sql`DELETE FROM parts`;
    console.log(`   ✅ Deleted ${partsDeleted.count} parts`);

    const charactersDeleted = await sql`DELETE FROM characters`;
    console.log(`   ✅ Deleted ${charactersDeleted.count} characters`);

    const settingsDeleted = await sql`DELETE FROM settings`;
    console.log(`   ✅ Deleted ${settingsDeleted.count} settings`);

    const placesDeleted = await sql`DELETE FROM places`;
    console.log(`   ✅ Deleted ${placesDeleted.count} places`);

    const aiInteractionsDeleted = await sql`DELETE FROM ai_interactions`;
    console.log(`   ✅ Deleted ${aiInteractionsDeleted.count} AI interactions`);

    // Finally delete stories
    const storiesDeleted = await sql`DELETE FROM stories`;
    console.log(`   ✅ Deleted ${storiesDeleted.count} stories`);

    // Verify deletion
    console.log('\n📊 After deletion:');
    const afterCounts = await Promise.all([
      sql`SELECT COUNT(*) FROM stories`.then(r => ({ table: 'stories', count: r[0].count })),
      sql`SELECT COUNT(*) FROM characters`.then(r => ({ table: 'characters', count: r[0].count })),
      sql`SELECT COUNT(*) FROM settings`.then(r => ({ table: 'settings', count: r[0].count })),
      sql`SELECT COUNT(*) FROM parts`.then(r => ({ table: 'parts', count: r[0].count })),
      sql`SELECT COUNT(*) FROM chapters`.then(r => ({ table: 'chapters', count: r[0].count })),
      sql`SELECT COUNT(*) FROM scenes`.then(r => ({ table: 'scenes', count: r[0].count })),
      sql`SELECT COUNT(*) FROM ai_interactions`.then(r => ({ table: 'ai_interactions', count: r[0].count })),
    ]);

    afterCounts.forEach(({ table, count }) => {
      console.log(`   ${table}: ${count} records`);
    });

    console.log('\n✅ Complete cleanup finished successfully!');

    await sql.end();
    return storyIds;

  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    throw error;
  }
}

// Execute
deleteAllStories()
  .then((storyIds) => {
    console.log('\n✨ All stories and related data have been removed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
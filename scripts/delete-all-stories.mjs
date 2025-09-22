#!/usr/bin/env node

import { config } from 'dotenv';
import pg from 'pg';

// Load environment variables
config({ path: '.env.local' });

const { Client } = pg;

async function deleteAllStories() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    await client.connect();
    console.log('🗑️  Deleting all stories and related data...\n');

    // Show current counts
    console.log('📊 Current database state:');
    const counts = await Promise.all([
      client.query('SELECT COUNT(*) FROM stories').then(r => ({ table: 'stories', count: r.rows[0].count })),
      client.query('SELECT COUNT(*) FROM characters').then(r => ({ table: 'characters', count: r.rows[0].count })),
      client.query('SELECT COUNT(*) FROM settings').then(r => ({ table: 'settings', count: r.rows[0].count })),
      client.query('SELECT COUNT(*) FROM parts').then(r => ({ table: 'parts', count: r.rows[0].count })),
      client.query('SELECT COUNT(*) FROM chapters').then(r => ({ table: 'chapters', count: r.rows[0].count })),
      client.query('SELECT COUNT(*) FROM scenes').then(r => ({ table: 'scenes', count: r.rows[0].count })),
      client.query('SELECT COUNT(*) FROM ai_interactions').then(r => ({ table: 'ai_interactions', count: r.rows[0].count })),
      client.query('SELECT COUNT(*) FROM community_posts').then(r => ({ table: 'community_posts', count: r.rows[0].count })),
    ]);

    counts.forEach(({ table, count }) => {
      console.log(`   ${table}: ${count} records`);
    });

    // Get story IDs for Blob cleanup
    const storiesResult = await client.query('SELECT id, title FROM stories');
    const storyIds = storiesResult.rows;

    if (storyIds.length > 0) {
      console.log('\n📚 Stories to delete:');
      storyIds.forEach(story => {
        console.log(`   - ${story.title} (${story.id})`);
      });
    }

    // Delete all stories (cascade will handle related records)
    console.log('\n🔥 Deleting all stories (CASCADE will delete related data)...');
    const deleteResult = await client.query('DELETE FROM stories');
    console.log(`   ✅ Deleted ${deleteResult.rowCount} stories`);

    // Verify deletion
    console.log('\n📊 After deletion:');
    const afterCounts = await Promise.all([
      client.query('SELECT COUNT(*) FROM stories').then(r => ({ table: 'stories', count: r.rows[0].count })),
      client.query('SELECT COUNT(*) FROM characters').then(r => ({ table: 'characters', count: r.rows[0].count })),
      client.query('SELECT COUNT(*) FROM settings').then(r => ({ table: 'settings', count: r.rows[0].count })),
      client.query('SELECT COUNT(*) FROM parts').then(r => ({ table: 'parts', count: r.rows[0].count })),
      client.query('SELECT COUNT(*) FROM chapters').then(r => ({ table: 'chapters', count: r.rows[0].count })),
      client.query('SELECT COUNT(*) FROM scenes').then(r => ({ table: 'scenes', count: r.rows[0].count })),
      client.query('SELECT COUNT(*) FROM ai_interactions').then(r => ({ table: 'ai_interactions', count: r.rows[0].count })),
      client.query('SELECT COUNT(*) FROM community_posts').then(r => ({ table: 'community_posts', count: r.rows[0].count })),
    ]);

    afterCounts.forEach(({ table, count }) => {
      console.log(`   ${table}: ${count} records`);
    });

    console.log('\n✅ Database cleanup completed!');

    // Return story IDs for Blob cleanup
    return storyIds;

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Execute
deleteAllStories()
  .then((storyIds) => {
    if (storyIds && storyIds.length > 0) {
      console.log('\n⚠️  Note: Vercel Blob storage may still contain images for these story IDs:');
      storyIds.forEach(story => {
        console.log(`   - ${story.id}`);
      });
      console.log('\n   Blob storage cleanup would need to be done via Vercel dashboard or API.');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
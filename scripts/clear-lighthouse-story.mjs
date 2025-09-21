#!/usr/bin/env node

// Script to remove "The Lighthouse Keeper's Price" story and related data
import { config } from 'dotenv';
import postgres from 'postgres';

// Load environment variables
config({ path: '.env.local' });

console.log('🗑️  Removing "The Lighthouse Keeper\'s Price" story and related data...');

const sql = postgres(process.env.POSTGRES_URL);

async function removeSpecificStory() {
  try {
    console.log('🔗 Connected to database');

    // First, let's find the story by title
    console.log('🔍 Finding "The Lighthouse Keeper\'s Price" story...');
    const stories = await sql`
      SELECT id, title FROM stories
      WHERE title LIKE '%Lighthouse%' OR title LIKE '%Lens%'
    `;

    console.log(`Found ${stories.length} lighthouse-related stories:`);
    stories.forEach(story => {
      console.log(`  - ID: ${story.id}, Title: "${story.title}"`);
    });

    if (stories.length === 0) {
      console.log('✅ No lighthouse-related stories found to delete');
      return;
    }

    // Get the story IDs
    const storyIds = stories.map(story => story.id);

    // Delete in correct order (respecting foreign key constraints)
    console.log('📝 Deleting scenes...');
    const scenesResult = await sql`
      DELETE FROM scenes
      WHERE chapter_id IN (
        SELECT id FROM chapters WHERE story_id = ANY(${storyIds})
      )
    `;
    console.log(`✅ Deleted ${scenesResult.count || 0} scenes`);

    console.log('📖 Deleting chapters...');
    const chaptersResult = await sql`
      DELETE FROM chapters WHERE story_id = ANY(${storyIds})
    `;
    console.log(`✅ Deleted ${chaptersResult.count || 0} chapters`);

    console.log('📚 Deleting parts...');
    const partsResult = await sql`
      DELETE FROM parts WHERE story_id = ANY(${storyIds})
    `;
    console.log(`✅ Deleted ${partsResult.count || 0} parts`);

    console.log('👤 Deleting characters...');
    const charactersResult = await sql`
      DELETE FROM characters WHERE story_id = ANY(${storyIds})
    `;
    console.log(`✅ Deleted ${charactersResult.count || 0} characters`);

    console.log('📍 Deleting places...');
    const placesResult = await sql`
      DELETE FROM places WHERE story_id = ANY(${storyIds})
    `;
    console.log(`✅ Deleted ${placesResult.count || 0} places`);

    console.log('⚙️ Deleting settings...');
    const settingsResult = await sql`
      DELETE FROM settings WHERE story_id = ANY(${storyIds})
    `;
    console.log(`✅ Deleted ${settingsResult.count || 0} settings`);

    console.log('📖 Deleting stories...');
    const storiesResult = await sql`
      DELETE FROM stories WHERE id = ANY(${storyIds})
    `;
    console.log(`✅ Deleted ${storiesResult.count || 0} stories`);

    console.log('🎉 Lighthouse story cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during lighthouse story cleanup:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

removeSpecificStory();
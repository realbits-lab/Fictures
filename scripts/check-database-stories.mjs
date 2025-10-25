#!/usr/bin/env node

/**
 * Check Database for Story Data
 *
 * Verifies if any story-related data remains in the database
 */

import { db } from '../src/lib/db/index.js';
import { stories, parts, chapters, scenes, characters, settings } from '../src/lib/db/schema.js';

console.log('🔍 Checking database for story-related data...\n');

try {
  // Count records in each table
  const storiesCount = (await db.select().from(stories)).length;
  const partsCount = (await db.select().from(parts)).length;
  const chaptersCount = (await db.select().from(chapters)).length;
  const scenesCount = (await db.select().from(scenes)).length;
  const charactersCount = (await db.select().from(characters)).length;
  const settingsCount = (await db.select().from(settings)).length;

  console.log('📊 Record counts:');
  console.log(`  Stories:    ${storiesCount}`);
  console.log(`  Parts:      ${partsCount}`);
  console.log(`  Chapters:   ${chaptersCount}`);
  console.log(`  Scenes:     ${scenesCount}`);
  console.log(`  Characters: ${charactersCount}`);
  console.log(`  Settings:   ${settingsCount}`);

  const total = storiesCount + partsCount + chaptersCount + scenesCount + charactersCount + settingsCount;

  if (total > 0) {
    console.log(`\n⚠️  Found ${total} records remaining in database`);

    // Show story IDs if any exist
    if (storiesCount > 0) {
      const allStories = await db.select().from(stories);
      console.log('\nStory IDs:');
      allStories.forEach(story => {
        console.log(`  - ${story.id} (${story.title})`);
      });
    }
  } else {
    console.log('\n✅ No story-related records found in database');
  }

} catch (error) {
  console.error('\n❌ Error checking database:', error.message);
  process.exit(1);
}

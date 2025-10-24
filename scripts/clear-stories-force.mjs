#!/usr/bin/env node

import dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables
dotenv.config({ path: '.env.local' });

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL not found in .env.local');
  process.exit(1);
}

// Check for --force flag
const force = process.argv.includes('--force');

if (!force) {
  console.log('⚠️  WARNING: This will delete ALL story data from the database!');
  console.log('   This includes stories, chapters, scenes, characters, settings, images, etc.');
  console.log('');
  console.log('To proceed, run with --force flag:');
  console.log('   node scripts/clear-stories-force.mjs --force');
  process.exit(0);
}

async function clearAllStoryData() {
  console.log('🗑️  Clearing all story data from database...');

  const client = postgres(POSTGRES_URL, { prepare: false });

  try {
    // Show current count
    const currentStories = await client`SELECT COUNT(*) as count FROM stories`;
    console.log(`\n📚 Current database contains ${currentStories[0].count} stories\n`);

    // Clear in order of dependencies (child tables first)
    console.log('   Deleting story subscriptions...');
    const subs = await client`DELETE FROM story_subscriptions`;
    console.log(`     Deleted ${subs.count} subscriptions`);

    console.log('   Deleting comments...');
    const comments = await client`DELETE FROM comments`;
    console.log(`     Deleted ${comments.count} comments`);

    console.log('   Deleting ratings...');
    const ratings = await client`DELETE FROM ratings`;
    console.log(`     Deleted ${ratings.count} ratings`);

    console.log('   Deleting reactions...');
    const reactions = await client`DELETE FROM reactions`;
    console.log(`     Deleted ${reactions.count} reactions`);

    console.log('   Deleting writing sessions...');
    const sessions = await client`DELETE FROM writing_sessions`;
    console.log(`     Deleted ${sessions.count} writing sessions`);

    console.log('   Deleting AI interactions...');
    const ai = await client`DELETE FROM ai_interactions`;
    console.log(`     Deleted ${ai.count} AI interactions`);

    console.log('   Deleting scenes...');
    const scenes = await client`DELETE FROM scenes`;
    console.log(`     Deleted ${scenes.count} scenes`);

    console.log('   Deleting chapters...');
    const chapters = await client`DELETE FROM chapters`;
    console.log(`     Deleted ${chapters.count} chapters`);

    console.log('   Deleting parts...');
    const parts = await client`DELETE FROM parts`;
    console.log(`     Deleted ${parts.count} parts`);

    console.log('   Deleting characters...');
    const characters = await client`DELETE FROM characters`;
    console.log(`     Deleted ${characters.count} characters`);

    console.log('   Deleting places...');
    const places = await client`DELETE FROM places`;
    console.log(`     Deleted ${places.count} places`);

    console.log('   Deleting stories...');
    const stories = await client`DELETE FROM stories`;
    console.log(`     Deleted ${stories.count} stories`);

    // Verify deletion
    const storyCount = await client`SELECT COUNT(*) as count FROM stories`;
    const chapterCount = await client`SELECT COUNT(*) as count FROM chapters`;
    const sceneCount = await client`SELECT COUNT(*) as count FROM scenes`;

    console.log('\n📊 Verification:');
    console.log(`   Stories remaining: ${storyCount[0].count}`);
    console.log(`   Chapters remaining: ${chapterCount[0].count}`);
    console.log(`   Scenes remaining: ${sceneCount[0].count}`);

    await client.end();
    console.log('\n✨ Database cleanup complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Failed to clear story data:', error.message || error);
    await client.end();
    process.exit(1);
  }
}

// Run immediately with --force
clearAllStoryData();
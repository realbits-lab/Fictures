#!/usr/bin/env node

import dotenv from 'dotenv';
import postgres from 'postgres';
import readline from 'readline';

// Load environment variables
dotenv.config({ path: '.env.local' });

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL not found in .env.local');
  process.exit(1);
}

async function clearAllStoryData() {
  console.log('🗑️  Clearing all story data from database...');

  const client = postgres(POSTGRES_URL, { prepare: false });

  try {
    // Start transaction
    await client.begin(async sql => {
      // Clear in order of dependencies (reverse foreign key order)

      console.log('   Deleting saved stories...');
      const saved = await sql`DELETE FROM saved_stories`;
      console.log(`     Deleted ${saved.count} saved stories`);

      console.log('   Deleting community posts...');
      const posts = await sql`DELETE FROM community_posts`;
      console.log(`     Deleted ${posts.count} community posts`);

      console.log('   Deleting AI interactions...');
      const ai = await sql`DELETE FROM ai_interactions`;
      console.log(`     Deleted ${ai.count} AI interactions`);

      console.log('   Deleting story images...');
      const images = await sql`DELETE FROM story_images`;
      console.log(`     Deleted ${images.count} story images`);

      console.log('   Deleting scenes...');
      const scenes = await sql`DELETE FROM scenes`;
      console.log(`     Deleted ${scenes.count} scenes`);

      console.log('   Deleting chapters...');
      const chapters = await sql`DELETE FROM chapters`;
      console.log(`     Deleted ${chapters.count} chapters`);

      console.log('   Deleting parts...');
      const parts = await sql`DELETE FROM parts`;
      console.log(`     Deleted ${parts.count} parts`);

      console.log('   Deleting characters...');
      const characters = await sql`DELETE FROM characters`;
      console.log(`     Deleted ${characters.count} characters`);

      console.log('   Deleting settings...');
      const settings = await sql`DELETE FROM settings`;
      console.log(`     Deleted ${settings.count} settings`);

      console.log('   Deleting stories...');
      const stories = await sql`DELETE FROM stories`;
      console.log(`     Deleted ${stories.count} stories`);

      console.log('✅ All story data cleared successfully');
    });

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

// Add confirmation prompt
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  WARNING: This will delete ALL story data from the database!');
console.log('   This includes stories, chapters, scenes, characters, settings, images, etc.');

// First show current count
async function main() {
  const testClient = postgres(POSTGRES_URL, { prepare: false });
  try {
    const stories = await testClient`SELECT COUNT(*) as count FROM stories`;
    console.log(`\n📚 Current database contains ${stories[0].count} stories`);
    await testClient.end();
  } catch (e) {
    console.error('Could not get story count');
  }

  console.log('');
  rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      rl.close();
      clearAllStoryData();
    } else {
      console.log('❌ Operation cancelled');
      rl.close();
      process.exit(0);
    }
  });
}

main();
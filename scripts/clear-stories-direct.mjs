#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema.js';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config({ path: '.env.local' });

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL not found in .env.local');
  process.exit(1);
}

console.log('📌 Connecting to database...');

// Create connection
const client = postgres(POSTGRES_URL, { prepare: false });
const db = drizzle(client, { schema });

async function clearAllStoryData() {
  console.log('🗑️  Clearing all story data from database...');

  try {
    // Clear in order of dependencies
    console.log('   Deleting saved stories...');
    await db.delete(schema.savedStories);

    console.log('   Deleting community posts...');
    await db.delete(schema.communityPosts);

    console.log('   Deleting AI interactions...');
    await db.delete(schema.aiInteractions);

    console.log('   Deleting story images...');
    await db.delete(schema.storyImages);

    console.log('   Deleting scenes...');
    await db.delete(schema.scenes);

    console.log('   Deleting chapters...');
    await db.delete(schema.chapters);

    console.log('   Deleting parts...');
    await db.delete(schema.parts);

    console.log('   Deleting characters...');
    await db.delete(schema.characters);

    console.log('   Deleting settings...');
    await db.delete(schema.settings);

    console.log('   Deleting stories...');
    await db.delete(schema.stories);

    console.log('✅ All story data cleared successfully');

    // Verify deletion
    const storyCount = await db.select({ count: sql`count(*)::int` }).from(schema.stories);
    const chapterCount = await db.select({ count: sql`count(*)::int` }).from(schema.chapters);
    const sceneCount = await db.select({ count: sql`count(*)::int` }).from(schema.scenes);

    console.log('\n📊 Verification:');
    console.log(`   Stories remaining: ${storyCount[0].count}`);
    console.log(`   Chapters remaining: ${chapterCount[0].count}`);
    console.log(`   Scenes remaining: ${sceneCount[0].count}`);

    // Close connection
    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Failed to clear story data:', error);
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
console.log('');

rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    rl.close();
    clearAllStoryData();
  } else {
    console.log('❌ Operation cancelled');
    rl.close();
    client.end();
    process.exit(0);
  }
});
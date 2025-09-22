#!/usr/bin/env tsx

// Set POSTGRES_URL if not already set
if (!process.env.POSTGRES_URL) {
  // Try to load from .env.local
  require('dotenv').config({ path: '.env.local' });

  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL environment variable is not set');
    console.error('   Please ensure .env.local contains POSTGRES_URL');
    process.exit(1);
  }
}

import { db } from '../src/lib/db';
import {
  stories,
  parts,
  chapters,
  scenes,
  characters,
  settings,
  storyImages,
  aiInteractions,
  communityPosts,
  savedStories
} from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function clearAllStoryData() {
  console.log('🗑️  Clearing all story data from database...');

  try {
    // Start transaction
    await db.transaction(async (tx) => {
      // Clear in order of dependencies (reverse foreign key order)

      console.log('   Deleting saved stories...');
      await tx.delete(savedStories);

      console.log('   Deleting community posts...');
      await tx.delete(communityPosts);

      console.log('   Deleting AI interactions...');
      await tx.delete(aiInteractions);

      console.log('   Deleting story images...');
      await tx.delete(storyImages);

      console.log('   Deleting scenes...');
      await tx.delete(scenes);

      console.log('   Deleting chapters...');
      await tx.delete(chapters);

      console.log('   Deleting parts...');
      await tx.delete(parts);

      console.log('   Deleting characters...');
      await tx.delete(characters);

      console.log('   Deleting settings...');
      await tx.delete(settings);

      console.log('   Deleting stories...');
      await tx.delete(stories);

      console.log('✅ All story data cleared successfully');
    });

    // Verify deletion
    const storyCount = await db.select({ count: sql<number>`count(*)` }).from(stories);
    const chapterCount = await db.select({ count: sql<number>`count(*)` }).from(chapters);
    const sceneCount = await db.select({ count: sql<number>`count(*)` }).from(scenes);

    console.log('\n📊 Verification:');
    console.log(`   Stories remaining: ${storyCount[0].count}`);
    console.log(`   Chapters remaining: ${chapterCount[0].count}`);
    console.log(`   Scenes remaining: ${sceneCount[0].count}`);

  } catch (error) {
    console.error('❌ Failed to clear story data:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Add confirmation prompt
const readline = require('readline');
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
    process.exit(0);
  }
});
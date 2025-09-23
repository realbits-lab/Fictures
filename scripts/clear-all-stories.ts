#!/usr/bin/env npx tsx
/**
 * Script to clear all stories and related data from database
 */

import { db } from '@/lib/db';
import {
  stories,
  chapters,
  scenes,
  parts,
  characters,
  aiInteractions,
  settings
} from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

async function clearAllStories() {
  console.log('🗑️ Starting database cleanup...');
  console.log('=' .repeat(80));

  try {
    // Delete in order of dependencies
    console.log('\n📝 Deleting AI interactions...');
    const aiResult = await db.delete(aiInteractions);
    console.log(`   Deleted AI interactions`);

    console.log('\n📝 Deleting settings...');
    const settingsResult = await db.delete(settings);
    console.log(`   Deleted settings`);

    console.log('\n📝 Deleting characters...');
    const charactersResult = await db.delete(characters);
    console.log(`   Deleted characters`);

    console.log('\n📝 Deleting scenes...');
    const scenesResult = await db.delete(scenes);
    console.log(`   Deleted scenes`);

    console.log('\n📝 Deleting chapters...');
    const chaptersResult = await db.delete(chapters);
    console.log(`   Deleted chapters`);

    console.log('\n📝 Deleting parts...');
    const partsResult = await db.delete(parts);
    console.log(`   Deleted parts`);

    console.log('\n📝 Deleting stories...');
    const storiesResult = await db.delete(stories);
    console.log(`   Deleted stories`);

    console.log('\n' + '=' .repeat(80));
    console.log('✅ Database cleanup complete!');
    console.log('   All stories and related data have been removed.');

  } catch (error) {
    console.error('\n❌ Error clearing database:', error);
    process.exit(1);
  }
}

// Run the cleanup
clearAllStories().catch(console.error);
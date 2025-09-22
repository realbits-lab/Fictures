#!/usr/bin/env node

// Direct database cleanup script
import { db } from '../src/lib/db/index.js';
import {
  stories,
  parts,
  chapters,
  scenes,
  characters,
  settings,
} from '../src/lib/db/schema.js';

async function cleanupDatabase() {
  console.log('🧹 Direct Database Cleanup');
  console.log('==========================');

  try {
    // Delete all related data in the correct order to respect foreign key constraints
    console.log('\n📍 Deleting scenes...');
    const deletedScenes = await db.delete(scenes);
    console.log(`✓ Deleted ${deletedScenes.rowCount || 0} scenes`);

    console.log('\n📍 Deleting chapters...');
    const deletedChapters = await db.delete(chapters);
    console.log(`✓ Deleted ${deletedChapters.rowCount || 0} chapters`);

    console.log('\n📍 Deleting parts...');
    const deletedParts = await db.delete(parts);
    console.log(`✓ Deleted ${deletedParts.rowCount || 0} parts`);

    console.log('\n📍 Deleting characters...');
    const deletedCharacters = await db.delete(characters);
    console.log(`✓ Deleted ${deletedCharacters.rowCount || 0} characters`);

    console.log('\n📍 Deleting settings...');
    const deletedSettings = await db.delete(settings);
    console.log(`✓ Deleted ${deletedSettings.rowCount || 0} settings`);

    console.log('\n📍 Deleting stories...');
    const deletedStories = await db.delete(stories);
    console.log(`✓ Deleted ${deletedStories.rowCount || 0} stories`);

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('All story data has been removed from the database.');

  } catch (error) {
    console.error('\n❌ Database cleanup failed:', error);
    process.exit(1);
  }
}

cleanupDatabase().catch(console.error);
#!/usr/bin/env node

// Simple SQL-based cleanup script
import { config } from 'dotenv';
import postgres from 'postgres';

// Load environment variables
config({ path: '.env.local' });

console.log('🗑️  Starting database cleanup...');

const sql = postgres(process.env.POSTGRES_URL);

async function clearDatabase() {
  try {
    console.log('🔗 Connected to database');

    console.log('📝 Deleting scenes...');
    const scenesResult = await sql`DELETE FROM scenes`;
    console.log(`✅ Deleted ${scenesResult.count || 0} scenes`);

    console.log('📖 Deleting chapters...');
    const chaptersResult = await sql`DELETE FROM chapters`;
    console.log(`✅ Deleted ${chaptersResult.count || 0} chapters`);

    console.log('📚 Deleting parts...');
    const partsResult = await sql`DELETE FROM parts`;
    console.log(`✅ Deleted ${partsResult.count || 0} parts`);

    console.log('👤 Deleting characters...');
    const charactersResult = await sql`DELETE FROM characters`;
    console.log(`✅ Deleted ${charactersResult.count || 0} characters`);

    console.log('📍 Deleting places...');
    const placesResult = await sql`DELETE FROM places`;
    console.log(`✅ Deleted ${placesResult.count || 0} places`);

    console.log('⚙️ Deleting settings...');
    const settingsResult = await sql`DELETE FROM settings`;
    console.log(`✅ Deleted ${settingsResult.count || 0} settings`);

    console.log('📖 Deleting stories...');
    const storiesResult = await sql`DELETE FROM stories`;
    console.log(`✅ Deleted ${storiesResult.count || 0} stories`);

    console.log('🎉 Database cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

clearDatabase();
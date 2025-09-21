import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const sql = postgres(process.env.POSTGRES_URL);

async function clearAllStories() {
  try {
    console.log('🗑️  Clearing all stories from database...');

    // Delete in order due to foreign key constraints
    console.log('Deleting scenes...');
    const scenesResult = await sql`DELETE FROM scenes`;
    console.log(`✅ Deleted ${scenesResult.count} scenes`);

    console.log('Deleting chapters...');
    const chaptersResult = await sql`DELETE FROM chapters`;
    console.log(`✅ Deleted ${chaptersResult.count} chapters`);

    console.log('Deleting parts...');
    const partsResult = await sql`DELETE FROM parts`;
    console.log(`✅ Deleted ${partsResult.count} parts`);

    console.log('Deleting characters...');
    const charactersResult = await sql`DELETE FROM characters`;
    console.log(`✅ Deleted ${charactersResult.count} characters`);

    console.log('Deleting places...');
    const placesResult = await sql`DELETE FROM places`;
    console.log(`✅ Deleted ${placesResult.count} places`);

    console.log('Deleting settings...');
    const settingsResult = await sql`DELETE FROM settings`;
    console.log(`✅ Deleted ${settingsResult.count} settings`);

    console.log('Deleting stories...');
    const storiesResult = await sql`DELETE FROM stories`;
    console.log(`✅ Deleted ${storiesResult.count} stories`);

    console.log('\n🎉 Database cleared successfully!');
    console.log('Ready for fresh story generation.');

  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await sql.end();
  }
}

clearAllStories();
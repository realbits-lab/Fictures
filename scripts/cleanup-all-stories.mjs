import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const sql = postgres(process.env.POSTGRES_URL);

console.log('🗑️  Starting cleanup of all stories and related data...');

try {
  // Delete in order due to foreign key constraints
  console.log('Deleting scenes...');
  const deletedScenes = await sql`DELETE FROM scenes`;
  console.log(`✅ Deleted ${deletedScenes.count || 0} scenes`);

  console.log('Deleting chapters...');
  const deletedChapters = await sql`DELETE FROM chapters`;
  console.log(`✅ Deleted ${deletedChapters.count || 0} chapters`);

  console.log('Deleting parts...');
  const deletedParts = await sql`DELETE FROM parts`;
  console.log(`✅ Deleted ${deletedParts.count || 0} parts`);

  console.log('Deleting characters...');
  const deletedCharacters = await sql`DELETE FROM characters`;
  console.log(`✅ Deleted ${deletedCharacters.count || 0} characters`);

  console.log('Deleting settings...');
  const deletedSettings = await sql`DELETE FROM settings`;
  console.log(`✅ Deleted ${deletedSettings.count || 0} settings`);

  console.log('Deleting stories...');
  const deletedStories = await sql`DELETE FROM stories`;
  console.log(`✅ Deleted ${deletedStories.count || 0} stories`);

  console.log('🎉 All stories and related data cleaned up successfully!');
} catch (error) {
  console.error('❌ Error during cleanup:', error);
} finally {
  await sql.end();
  process.exit(0);
}
/**
 * Cleanup script to delete all test stories from the database
 */

import { neon } from '@neondatabase/serverless';

async function cleanupStories() {
  console.log('🗑️  Cleaning up test stories...\n');

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Get count of stories before deletion
    const countBefore = await sql`
      SELECT COUNT(*) as count FROM stories
    `;
    console.log(`   Found ${countBefore[0].count} stories in database`);

    if (countBefore[0].count === '0') {
      console.log('   No stories to delete');
      return;
    }

    // Delete all related data (cascading)
    console.log('\n   Deleting scenes...');
    const scenesResult = await sql`DELETE FROM scenes`;
    console.log(`   ✅ Deleted ${scenesResult.count} scenes`);

    console.log('\n   Deleting chapters...');
    const chaptersResult = await sql`DELETE FROM chapters`;
    console.log(`   ✅ Deleted ${chaptersResult.count} chapters`);

    console.log('\n   Deleting parts...');
    const partsResult = await sql`DELETE FROM parts`;
    console.log(`   ✅ Deleted ${partsResult.count} parts`);

    console.log('\n   Deleting characters...');
    const charactersResult = await sql`DELETE FROM characters WHERE "storyId" IN (SELECT id FROM stories)`;
    console.log(`   ✅ Deleted ${charactersResult.count} characters`);

    console.log('\n   Deleting settings...');
    const settingsResult = await sql`DELETE FROM settings WHERE "storyId" IN (SELECT id FROM stories)`;
    console.log(`   ✅ Deleted ${settingsResult.count} settings`);

    console.log('\n   Deleting stories...');
    const storiesResult = await sql`DELETE FROM stories`;
    console.log(`   ✅ Deleted ${storiesResult.count} stories`);

    console.log('\n✅ Cleanup complete!\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    throw error;
  }
}

cleanupStories().catch(error => {
  console.error('\n💥 Script execution failed');
  process.exit(1);
});

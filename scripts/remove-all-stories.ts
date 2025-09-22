import { db } from '../src/lib/db';
import {
  stories,
  parts,
  chapters,
  scenes,
  characters,
  settings,
  communityPosts,
  aiInteractions
} from '../src/lib/db/schema';

async function removeAllStories() {
  console.log('🗑️  Starting complete story data cleanup...\n');

  try {
    // Delete in reverse dependency order to avoid foreign key constraints
    // Wrap each in try-catch to handle tables that don't exist

    try {
      console.log('Deleting AI interactions...');
      const aiResult = await db.delete(aiInteractions);
      console.log(`  ✓ Removed all AI interactions`);
    } catch (e: any) {
      if (e.cause?.code === '42P01') {
        console.log(`  ⚠️  Table aiInteractions doesn't exist, skipping...`);
      } else throw e;
    }

    try {
      console.log('Deleting community posts...');
      const postsResult = await db.delete(communityPosts);
      console.log(`  ✓ Removed all community posts`);
    } catch (e: any) {
      if (e.cause?.code === '42P01') {
        console.log(`  ⚠️  Table communityPosts doesn't exist, skipping...`);
      } else throw e;
    }

    console.log('Deleting scenes...');
    const scenesResult = await db.delete(scenes);
    console.log(`  ✓ Removed all scenes`);

    console.log('Deleting chapters...');
    const chaptersResult = await db.delete(chapters);
    console.log(`  ✓ Removed all chapters`);

    console.log('Deleting parts...');
    const partsResult = await db.delete(parts);
    console.log(`  ✓ Removed all parts`);

    console.log('Deleting characters...');
    const charactersResult = await db.delete(characters);
    console.log(`  ✓ Removed all characters`);

    console.log('Deleting settings...');
    const settingsResult = await db.delete(settings);
    console.log(`  ✓ Removed all settings`);

    console.log('Deleting stories...');
    const storiesResult = await db.delete(stories);
    console.log(`  ✓ Removed all stories`);

    console.log('\n✅ Database cleanup complete!');
    console.log('   All stories and related data have been removed.');
    console.log('   Ready for fresh story generation with nanoid IDs.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

removeAllStories()
  .then(() => {
    console.log('\n🎉 Cleanup successful! You can now generate new stories.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });
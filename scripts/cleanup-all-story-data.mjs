import { db } from '../src/lib/db/index.js';
import { stories, parts, chapters, scenes, characters, settings, aiInteractions, communityPosts, communityLikes, communityReplies, storyBookmarks, storyLikes, readingSessions, storyInsights } from '../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { list, del } from '@vercel/blob';

console.log('🔍 Starting complete story data cleanup...\n');

try {
  // 1. Get all story IDs first
  console.log('📚 Fetching all stories...');
  const allStories = await db.select().from(stories);
  console.log(`Found ${allStories.length} stories in database\n`);

  if (allStories.length === 0) {
    console.log('✅ No stories found in database');
  } else {
    for (const story of allStories) {
      console.log(`\n🗑️ Removing story: ${story.title} (${story.id})`);

      // Count related records
      const relatedParts = await db.select().from(parts).where(eq(parts.storyId, story.id));
      const relatedChapters = await db.select().from(chapters).where(eq(chapters.storyId, story.id));
      const relatedScenes = await db.select().from(scenes).where(eq(scenes.storyId, story.id));
      const relatedCharacters = await db.select().from(characters).where(eq(characters.storyId, story.id));
      const relatedSettings = await db.select().from(settings).where(eq(settings.storyId, story.id));

      console.log(`  📊 Related records:`);
      console.log(`    - Parts: ${relatedParts.length}`);
      console.log(`    - Chapters: ${relatedChapters.length}`);
      console.log(`    - Scenes: ${relatedScenes.length}`);
      console.log(`    - Characters: ${relatedCharacters.length}`);
      console.log(`    - Settings: ${relatedSettings.length}`);

      // Delete related records in correct order (respecting foreign keys)
      console.log(`  🧹 Deleting database records...`);

      // Delete AI interactions
      await db.delete(aiInteractions).where(eq(aiInteractions.storyId, story.id));

      // Delete reading sessions and insights
      await db.delete(storyInsights).where(eq(storyInsights.storyId, story.id));
      await db.delete(readingSessions).where(eq(readingSessions.storyId, story.id));

      // Delete community data
      await db.delete(communityReplies).where(eq(communityReplies.postId, story.id));
      await db.delete(communityLikes).where(eq(communityLikes.postId, story.id));
      await db.delete(communityPosts).where(eq(communityPosts.storyId, story.id));

      // Delete bookmarks and likes
      await db.delete(storyBookmarks).where(eq(storyBookmarks.storyId, story.id));
      await db.delete(storyLikes).where(eq(storyLikes.storyId, story.id));

      // Delete story structure
      await db.delete(scenes).where(eq(scenes.storyId, story.id));
      await db.delete(chapters).where(eq(chapters.storyId, story.id));
      await db.delete(parts).where(eq(parts.storyId, story.id));

      // Delete characters and settings
      await db.delete(characters).where(eq(characters.storyId, story.id));
      await db.delete(settings).where(eq(settings.storyId, story.id));

      // Finally delete the story itself
      await db.delete(stories).where(eq(stories.id, story.id));

      console.log(`  ✅ Database records deleted`);
    }
  }

  // 2. Check for orphaned records in each table
  console.log('\n\n🔍 Checking for orphaned records...\n');

  const allPartsCount = (await db.select().from(parts)).length;
  const allChaptersCount = (await db.select().from(chapters)).length;
  const allScenesCount = (await db.select().from(scenes)).length;
  const allCharactersCount = (await db.select().from(characters)).length;
  const allSettingsCount = (await db.select().from(settings)).length;
  const allStoriesCount = (await db.select().from(stories)).length;

  console.log('📊 Remaining records:');
  console.log(`  - Stories: ${allStoriesCount}`);
  console.log(`  - Parts: ${allPartsCount}`);
  console.log(`  - Chapters: ${allChaptersCount}`);
  console.log(`  - Scenes: ${allScenesCount}`);
  console.log(`  - Characters: ${allCharactersCount}`);
  console.log(`  - Settings: ${allSettingsCount}`);

  // 3. Check Vercel Blob for story-related images
  console.log('\n\n🔍 Checking Vercel Blob storage...\n');

  let totalBlobFiles = 0;
  let deletedBlobFiles = 0;

  // List all blobs with 'stories/' prefix
  console.log('📦 Listing all story-related blobs...');
  const { blobs } = await list({ prefix: 'stories/' });

  totalBlobFiles = blobs.length;
  console.log(`Found ${totalBlobFiles} blob files with 'stories/' prefix\n`);

  if (totalBlobFiles > 0) {
    console.log('🗑️ Deleting blob files...');
    for (const blob of blobs) {
      try {
        await del(blob.url);
        deletedBlobFiles++;
        console.log(`  ✅ Deleted: ${blob.pathname}`);
      } catch (error) {
        console.error(`  ❌ Failed to delete ${blob.pathname}:`, error.message);
      }
    }
  }

  // Summary
  console.log('\n\n📊 CLEANUP SUMMARY');
  console.log('='.repeat(50));
  console.log(`Stories removed: ${allStories.length}`);
  console.log(`Database records cleaned: All story-related tables`);
  console.log(`Blob files found: ${totalBlobFiles}`);
  console.log(`Blob files deleted: ${deletedBlobFiles}`);
  console.log(`Remaining stories in database: ${allStoriesCount}`);
  console.log('='.repeat(50));

  if (allStoriesCount === 0 && deletedBlobFiles === totalBlobFiles) {
    console.log('\n✅ All story data successfully removed!');
  } else if (allStoriesCount > 0) {
    console.log('\n⚠️ Some stories remain in database');
  } else if (deletedBlobFiles < totalBlobFiles) {
    console.log('\n⚠️ Some blob files failed to delete');
  }

} catch (error) {
  console.error('\n❌ Error during cleanup:', error);
  process.exit(1);
}

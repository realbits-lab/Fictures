#!/usr/bin/env tsx

/**
 * Check and Clean Database
 *
 * Directly checks and cleans all story-related data from the database
 */

import { db } from '../src/lib/db/index';
import { stories, parts, chapters, scenes, characters, settings, communityPosts, communityReplies, postLikes, storyLikes, readingSessions, storyInsights, readingHistory } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🔍 Checking database for story-related data...\n');

  try {
    // Count records in each table
    const allStories = await db.select().from(stories);
    const allParts = await db.select().from(parts);
    const allChapters = await db.select().from(chapters);
    const allScenes = await db.select().from(scenes);
    const allCharacters = await db.select().from(characters);
    const allSettings = await db.select().from(settings);

    console.log('📊 Record counts:');
    console.log(`  Stories:    ${allStories.length}`);
    console.log(`  Parts:      ${allParts.length}`);
    console.log(`  Chapters:   ${allChapters.length}`);
    console.log(`  Scenes:     ${allScenes.length}`);
    console.log(`  Characters: ${allCharacters.length}`);
    console.log(`  Settings:   ${allSettings.length}`);

    const total = allStories.length + allParts.length + allChapters.length + allScenes.length + allCharacters.length + allSettings.length;

    if (total === 0) {
      console.log('\n✅ No story-related records found in database - database is clean!');
      process.exit(0);
    }

    console.log(`\n⚠️  Found ${total} records remaining in database`);

    // Show story details if any exist
    if (allStories.length > 0) {
      console.log('\n📖 Stories in database:');
      allStories.forEach(story => {
        console.log(`  - ${story.id} | ${story.title} | ${story.genre} | ${story.status}`);
      });
    }

    console.log('\n🗑️  Starting cleanup...\n');

    // Delete all story-related data
    let deletedCount = 0;

    for (const story of allStories) {
      console.log(`Removing story: ${story.title} (${story.id})`);

      // Delete related records in correct order (respecting foreign keys)
      // Note: aiInteractions doesn't have storyId, it's only linked to userId

      // First get all community posts for this story
      const posts = await db.select().from(communityPosts).where(eq(communityPosts.storyId, story.id));

      // Delete community data based on posts
      for (const post of posts) {
        await db.delete(communityReplies).where(eq(communityReplies.postId, post.id));
        await db.delete(postLikes).where(eq(postLikes.postId, post.id));
      }
      await db.delete(communityPosts).where(eq(communityPosts.storyId, story.id));

      // Delete other story-related data (only tables that exist in database)
      try { await db.delete(storyInsights).where(eq(storyInsights.storyId, story.id)); } catch (e) { /* table doesn't exist */ }
      try { await db.delete(readingSessions).where(eq(readingSessions.storyId, story.id)); } catch (e) { /* table doesn't exist */ }
      try { await db.delete(storyLikes).where(eq(storyLikes.storyId, story.id)); } catch (e) { /* table doesn't exist */ }

      // Delete story structure properly (respecting foreign keys)
      // 1. Get all chapters for this story
      const storyChapters = await db.select().from(chapters).where(eq(chapters.storyId, story.id));

      // 2. Delete scenes for each chapter (scenes reference chapterId, not storyId)
      for (const chapter of storyChapters) {
        await db.delete(scenes).where(eq(scenes.chapterId, chapter.id));
      }

      // 3. Delete chapters and parts (these reference storyId)
      await db.delete(chapters).where(eq(chapters.storyId, story.id));
      await db.delete(parts).where(eq(parts.storyId, story.id));

      // 4. Delete characters and settings (these reference storyId)
      await db.delete(characters).where(eq(characters.storyId, story.id));
      await db.delete(settings).where(eq(settings.storyId, story.id));

      // 5. Finally delete the story itself
      await db.delete(stories).where(eq(stories.id, story.id));

      deletedCount++;
      console.log(`  ✅ Removed`);
    }

    console.log(`\n✅ Successfully deleted ${deletedCount} stories and all related data`);

    // Verify cleanup
    const remainingStories = await db.select().from(stories);
    const remainingParts = await db.select().from(parts);
    const remainingChapters = await db.select().from(chapters);
    const remainingScenes = await db.select().from(scenes);

    console.log('\n📊 Final verification:');
    console.log(`  Stories:  ${remainingStories.length}`);
    console.log(`  Parts:    ${remainingParts.length}`);
    console.log(`  Chapters: ${remainingChapters.length}`);
    console.log(`  Scenes:   ${remainingScenes.length}`);

    if (remainingStories.length === 0 && remainingParts.length === 0 && remainingChapters.length === 0 && remainingScenes.length === 0) {
      console.log('\n✅ Database cleanup complete!');
    } else {
      console.log('\n⚠️  Some records still remain in database');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();

#!/usr/bin/env npx tsx

import { db } from '@/lib/db';
import { stories, chapters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function publishStory() {
  try {
    const storyId = 'Q185oK6qjmlmhDKNGpjGS';

    console.log(`🔍 Checking story ${storyId}...`);

    // Get the story
    const [story] = await db
      .select()
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    if (!story) {
      console.error('❌ Story not found!');
      return;
    }

    console.log(`📖 Found story: "${story.title}"`);
    console.log(`📊 Current status: ${story.status}`);

    // Get all chapters for this story
    const storyChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.storyId, storyId));

    console.log(`📚 Found ${storyChapters.length} chapters`);

    // Update story status to published
    await db
      .update(stories)
      .set({
        status: 'published',
        updatedAt: new Date()
      })
      .where(eq(stories.id, storyId));

    console.log('✅ Story status updated to published');

    // Update all chapters to published status
    for (const chapter of storyChapters) {
      await db
        .update(chapters)
        .set({
          status: 'published',
          updatedAt: new Date()
        })
        .where(eq(chapters.id, chapter.id));

      console.log(`✅ Chapter "${chapter.title}" published`);
    }

    console.log(`🎉 Story "${story.title}" and all ${storyChapters.length} chapters are now published!`);

    // Verify the updates
    const [updatedStory] = await db
      .select()
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    const updatedChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.storyId, storyId));

    console.log(`\n📊 Final Status:`);
    console.log(`   Story: ${updatedStory.status}`);
    console.log(`   Published Chapters: ${updatedChapters.filter(ch => ch.status === 'published').length}/${updatedChapters.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

publishStory();
#!/usr/bin/env npx tsx

import { db } from '@/lib/db';
import { stories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function fixStoryAuthor() {
  try {
    const storyId = 'UGZaiUBw8MGBlUFsJR6-B';
    const userId = 'woCkBHCnm1k6k7E3cK7rV';

    console.log('🔧 Fixing story author...');
    console.log('   Story ID:', storyId);
    console.log('   Setting Author ID to:', userId);

    const result = await db
      .update(stories)
      .set({ authorId: userId })
      .where(eq(stories.id, storyId));

    console.log('✅ Story author updated successfully!');

    // Verify the update
    const [updatedStory] = await db
      .select({ id: stories.id, title: stories.title, authorId: stories.authorId })
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    if (updatedStory) {
      console.log('\n📖 Updated Story:');
      console.log('   Story ID:', updatedStory.id);
      console.log('   Title:', updatedStory.title);
      console.log('   Author ID:', updatedStory.authorId);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

fixStoryAuthor();
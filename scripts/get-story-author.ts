#!/usr/bin/env npx tsx

import { db } from '@/lib/db';
import { stories } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

async function getStoryAuthor() {
  try {
    const latestStory = await db
      .select()
      .from(stories)
      .orderBy(desc(stories.createdAt))
      .limit(1);

    if (latestStory.length > 0) {
      const story = latestStory[0];
      console.log('📖 Latest Generated Story:');
      console.log('   Story ID:', story.id);
      console.log('   Title:', story.title);
      console.log('   Author ID (userId):', story.userId);
      console.log('   Status:', story.status);
      console.log('   Created:', story.createdAt);
    } else {
      console.log('❌ No stories found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

getStoryAuthor();
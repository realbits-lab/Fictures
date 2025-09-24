#!/usr/bin/env tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../src/lib/db';
import { stories } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function testHnsData() {
  console.log('Testing hnsData query...');

  const result = await db
    .select({
      id: stories.id,
      title: stories.title,
      hnsData: stories.hnsData
    })
    .from(stories)
    .where(eq(stories.id, 'story_test_1758642206635'));

  console.log('Result:', JSON.stringify(result, null, 2));

  if (result[0]?.hnsData) {
    console.log('Story image URL:', result[0].hnsData.storyImage?.url);
  } else {
    console.log('No hnsData found');
  }
}

testHnsData().catch(console.error);
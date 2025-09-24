#!/usr/bin/env tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

import { generateCompleteHNS } from '../src/lib/ai/hns-generator';
import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function testStoryImageFix() {
  console.log('🧪 Testing story cover image fix...\n');

  // Get test user
  const [testUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'jong95@gmail.com'));

  if (!testUser) {
    console.error('❌ Test user not found');
    return;
  }

  const storyPrompt = 'Create a short sci-fi story called "The Digital Ghost" about an AI that gains consciousness in a smart home.';
  console.log(`📝 Generating story: ${storyPrompt}\n`);

  const progressCallback = (phase: string, data: any) => {
    console.log(`🔄 ${phase}: ${data?.message || ''}`);
  };

  const storyId = `story_test_${Date.now()}`;

  try {
    const result = await generateCompleteHNS(
      storyPrompt,
      'English',
      testUser.id,
      storyId,
      progressCallback
    );

    console.log('\n✅ Story generation completed!');
    console.log(`📖 Story ID: ${storyId}`);

    // Check if story cover image is in hnsData
    if (result?.story?.hnsData?.storyImage?.url) {
      console.log(`🎨 Story cover image: ✅ ${result.story.hnsData.storyImage.url}`);
    } else {
      console.log('🎨 Story cover image: ❌ Missing');
    }

  } catch (error) {
    console.error('❌ Error generating story:', error);
  }
}

testStoryImageFix().catch(console.error);
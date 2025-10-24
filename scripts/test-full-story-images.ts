#!/usr/bin/env npx tsx
/**
 * Test script for generating a complete story with working scene images
 */

import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateCompleteHNS } from '@/lib/ai/hns-generator';

async function testFullStoryWithImages() {
  console.log('🎬 Testing Full Story Generation with Working Scene Images');
  console.log('=' .repeat(80));

  try {
    // Get a test user
    const [testUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, 'jong95@gmail.com'))
      .limit(1);

    if (!testUser) {
      console.error('❌ Test user not found. Please ensure user exists.');
      process.exit(1);
    }

    console.log(`\n📝 Using test user: ${testUser.email}`);

    // Define a simple test story prompt
    const storyPrompt = `Create a short fantasy adventure story called "The Crystal Awakens" about a mage discovering ancient magic. Make it 2 parts with minimal chapters.`;

    console.log('\n📖 Generating story from prompt:');
    console.log('   "' + storyPrompt + '"');
    console.log('\n   Expected features:');
    console.log('   ✅ Dynamic chapter/scene generation');
    console.log('   ✅ Real Gemini image generation (not placeholders)');
    console.log('   ✅ Images stored in Vercel Blob');

    // Track image generation progress
    let imageCount = 0;
    const progressCallback = (phase: string, data: any) => {
      if (phase.includes('image') || data?.message?.includes('image')) {
        imageCount++;
        console.log(`   📸 Image ${imageCount}: ${data?.message || phase}`);
      } else if (phase.includes('Phase 8')) {
        console.log('\n🎨 Starting mandatory scene image generation...');
      }
    };

    // Generate the story
    console.log('\n🚀 Starting story generation...\n');
    const storyId = nanoid();

    const result = await generateCompleteHNS(
      storyPrompt,
      'English',
      testUser.id,
      storyId,
      progressCallback
    );

    // Check results
    if (result && result.scenes) {
      console.log('\n' + '=' .repeat(80));
      console.log('📊 GENERATION RESULTS:');
      console.log('=' .repeat(80));

      console.log('\n📖 Story Structure:');
      console.log(`   Parts: ${result.parts?.length || 0}`);
      console.log(`   Chapters: ${result.chapters?.length || 0}`);
      console.log(`   Scenes: ${result.scenes?.length || 0}`);

      console.log('\n🖼️ Scene Image Analysis:');
      let realImages = 0;
      let placeholders = 0;

      result.scenes?.forEach((scene: any, i: number) => {
        const imageUrl = scene.scene_image?.url;
        const isReal = imageUrl?.includes('blob.vercel-storage.com');
        const isPlaceholder = imageUrl?.includes('picsum.photos');

        if (isReal) realImages++;
        if (isPlaceholder) placeholders++;

        console.log(`   Scene ${i + 1}: ${scene.scene_title}`);
        console.log(`     Image: ${isReal ? '✅ Real' : isPlaceholder ? '⚠️ Placeholder' : '❌ Missing'}`);
        if (imageUrl && isReal) {
          console.log(`     URL: ${imageUrl.substring(0, 60)}...`);
        }
      });

      console.log('\n📊 Summary:');
      console.log(`   Total Scenes: ${result.scenes?.length || 0}`);
      console.log(`   Real Images: ${realImages}`);
      console.log(`   Placeholders: ${placeholders}`);
      console.log(`   Success Rate: ${Math.round(realImages / (result.scenes?.length || 1) * 100)}%`);

      if (realImages > 0) {
        console.log('\n✅ SUCCESS! Gemini is generating real images!');
      } else {
        console.log('\n⚠️ Warning: No real images generated, using placeholders');
      }
    } else {
      console.log('\n❌ Story generation failed');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testFullStoryWithImages().catch(console.error);
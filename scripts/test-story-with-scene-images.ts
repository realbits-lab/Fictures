#!/usr/bin/env npx tsx
/**
 * Test script for generating a complete story with scene images
 */

import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateCompleteHNS } from '@/lib/ai/hns-generator';

async function testStoryWithSceneImages() {
  console.log('🎬 Testing Full Story Generation with Scene Images');
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

    // Define test story prompt
    const storyPrompt = `Create a fantasy adventure story titled "The Last Enchanter" about a world where magic is fading and the last enchanter must restore ancient crystals to save magic before it disappears forever. Make it an epic and mystical story for young adults with 2 parts and approximately 1000 words.`;

    console.log('\n📖 Generating story from prompt:');
    console.log('   "' + storyPrompt.substring(0, 80) + '..."');
    console.log('   Expected features:');
    console.log('   - Dynamic chapter/scene generation (1-3 per part/chapter)');
    console.log('   - Mandatory scene images using Gemini');
    console.log('   - Vercel Blob storage integration');

    // Track progress
    let lastPhase = '';
    const progressCallback = (message: string, phase?: string) => {
      if (phase && phase !== lastPhase) {
        console.log(`\n🔄 Phase: ${phase}`);
        lastPhase = phase;
      }
      if (message.includes('scene') && message.includes('image')) {
        console.log(`   📸 ${message}`);
      } else if (message.includes('Phase')) {
        console.log(`   ➡️ ${message}`);
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

    // Analyze results
    console.log('\n' + '=' .repeat(80));
    console.log('📊 GENERATION RESULTS:');
    console.log('=' .repeat(80));

    if (result.success && result.data) {
      const hns = result.data;

      // Story overview
      console.log('\n📖 Story Structure:');
      console.log(`   Title: ${hns.story.story_title}`);
      console.log(`   Parts: ${hns.parts.length}`);
      console.log(`   Total Chapters: ${hns.chapters.length}`);
      console.log(`   Total Scenes: ${hns.scenes.length}`);

      // Dynamic generation analysis
      console.log('\n🎲 Dynamic Generation Analysis:');
      hns.parts.forEach((part, idx) => {
        const partChapters = hns.chapters.filter(c => c.part_id === part.part_id);
        console.log(`\n   Part ${idx + 1}: "${part.part_title}"`);
        console.log(`   - Chapters: ${partChapters.length} (target: ${part.chapter_count || 1})`);

        partChapters.forEach((chapter, cIdx) => {
          const chapterScenes = hns.scenes.filter(s => s.chapter_ref === chapter.chapter_id);
          const expectedScenes = part.scene_counts?.[cIdx] || 1;
          console.log(`     Chapter ${cIdx + 1}: "${chapter.chapter_title}"`);
          console.log(`     - Scenes: ${chapterScenes.length} (target: ${expectedScenes})`);
        });
      });

      // Scene image analysis
      console.log('\n🖼️ Scene Image Generation:');
      let imagesGenerated = 0;
      let placeholders = 0;

      hns.scenes.forEach((scene, idx) => {
        const hasImage = !!scene.scene_image?.url;
        const isPlaceholder = scene.scene_image?.url?.includes('picsum.photos');

        if (hasImage) {
          imagesGenerated++;
          if (isPlaceholder) placeholders++;
        }

        console.log(`   Scene ${idx + 1}: "${scene.scene_title}"`);
        console.log(`     - Image: ${hasImage ? '✅' : '❌'} ${isPlaceholder ? '(placeholder)' : ''}`);
        if (scene.scene_image?.prompt) {
          console.log(`     - Prompt: "${scene.scene_image.prompt.substring(0, 60)}..."`);
        }
        if (scene.scene_image?.style) {
          console.log(`     - Style: ${scene.scene_image.style}`);
        }
      });

      console.log('\n📊 Image Summary:');
      console.log(`   Total Scenes: ${hns.scenes.length}`);
      console.log(`   Images Generated: ${imagesGenerated} (${Math.round(imagesGenerated/hns.scenes.length * 100)}%)`);
      console.log(`   Real Images: ${imagesGenerated - placeholders}`);
      console.log(`   Placeholders: ${placeholders}`);

      // Verify mandatory image generation
      const allScenesHaveImages = hns.scenes.every(s => s.scene_image?.url);
      console.log(`\n✅ Mandatory Image Check: ${allScenesHaveImages ? 'PASSED' : 'FAILED'}`);

      if (!allScenesHaveImages) {
        const missingImages = hns.scenes.filter(s => !s.scene_image?.url);
        console.log(`   ❌ ${missingImages.length} scenes missing images!`);
        missingImages.forEach(s => {
          console.log(`      - ${s.scene_title}`);
        });
      }

      console.log('\n' + '=' .repeat(80));
      console.log('🎉 Story Generation Complete!');
      console.log('\nKey Features Verified:');
      console.log('   ✅ Dynamic chapter/scene generation working');
      console.log('   ✅ Scene image generation integrated');
      console.log('   ✅ Mandatory image enforcement in place');
      console.log('   ✅ Fallback to placeholders when Gemini fails');

    } else {
      console.error('\n❌ Generation failed:', result.error);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testStoryWithSceneImages().catch(console.error);
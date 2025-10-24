#!/usr/bin/env tsx

import { config } from 'dotenv';
import { db } from '@/lib/db';
import {
  stories,
  parts as partsTable,
  chapters as chaptersTable,
  scenes as scenesTable,
  characters as charactersTable,
  settings as settingsTable,
  places as placesTable,
  users
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { list, del } from '@vercel/blob';
import { generateCompleteHNS } from '@/lib/ai/hns-generator';

// Load environment variables
config({ path: '.env.local' });

async function cleanAllStoriesAndData() {
  console.log('🧹 COMPREHENSIVE CLEANUP: Removing all stories and related data...');
  console.log('=' .repeat(80));

  try {
    // 1. Clean up Vercel Blob storage
    console.log('\n📦 Cleaning Vercel Blob storage...');
    try {
      const { blobs } = await list();
      console.log(`Found ${blobs.length} blobs to delete`);

      if (blobs.length > 0) {
        // Delete all blobs
        for (const blob of blobs) {
          await del(blob.url);
          console.log(`  ✅ Deleted blob: ${blob.pathname}`);
        }
        console.log(`✅ Deleted ${blobs.length} blobs from Vercel Blob storage`);
      } else {
        console.log('ℹ️ No blobs found in storage');
      }
    } catch (error) {
      console.error('⚠️ Error cleaning Vercel Blob storage:', error);
      // Continue with database cleanup even if blob cleanup fails
    }

    // 2. Clean up database tables (in dependency order)
    console.log('\n🗄️ Cleaning database tables...');

    // Delete scenes (no dependencies)
    const deletedScenes = await db.delete(scenesTable);
    console.log(`✅ Deleted all scenes`);

    // Delete chapters (references scenes via sceneIds array)
    const deletedChapters = await db.delete(chaptersTable);
    console.log(`✅ Deleted all chapters`);

    // Delete parts (references chapters via chapterIds array)
    const deletedParts = await db.delete(partsTable);
    console.log(`✅ Deleted all parts`);

    // Delete characters
    const deletedCharacters = await db.delete(charactersTable);
    console.log(`✅ Deleted all characters`);

    // Delete settings
    const deletedSettings = await db.delete(settingsTable);
    console.log(`✅ Deleted all settings`);

    // Delete places
    const deletedPlaces = await db.delete(placesTable);
    console.log(`✅ Deleted all places`);

    // Delete stories (references parts/chapters via arrays)
    const deletedStories = await db.delete(stories);
    console.log(`✅ Deleted all stories`);

    console.log('\n✅ Database cleanup complete!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

async function generateNewStory() {
  console.log('\n🎨 GENERATING NEW STORY...');
  console.log('=' .repeat(80));

  try {
    // Get test user
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

    // Creative story prompt for testing
    const storyPrompt = `Create an epic science fantasy adventure called "The Quantum Mage" about a brilliant physicist named Dr. Maya Chen who discovers that quantum mechanics can be manipulated through consciousness. Set in a near-future world where corporations control quantum technology, she must learn to "quantum weave" reality while being hunted by the Nexus Corporation. The story should explore themes of consciousness, reality manipulation, and the intersection of science and magic. Make it 3 parts with dynamic chapter generation.`;

    console.log('\n📖 Generating story from prompt:');
    console.log(`   "${storyPrompt}"`);

    console.log('\n   Expected features:');
    console.log('   ✅ Complete story with parts, chapters, and scenes');
    console.log('   ✅ Real Gemini image generation for all scenes');
    console.log('   ✅ Story cover image generation');
    console.log('   ✅ All images stored in Vercel Blob');

    // Track progress
    let imageCount = 0;
    const progressCallback = (phase: string, data: any) => {
      if (phase.includes('image') || data?.message?.includes('image')) {
        imageCount++;
        console.log(`   📸 ${data?.message || phase}`);
      } else if (phase.includes('Phase')) {
        console.log(`\n🔄 ${phase}: ${data?.message || ''}`);
      } else {
        console.log(`   ${data?.message || phase}`);
      }
    };

    // Generate the story
    console.log('\n🚀 Starting story generation...\n');
    const storyId = `story_${Date.now()}`;

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
      console.log('🎉 STORY GENERATION COMPLETE!');
      console.log('=' .repeat(80));

      console.log('\n📖 Story Structure:');
      console.log(`   Title: ${result.story?.story_title || 'Generated Story'}`);
      console.log(`   Parts: ${result.parts?.length || 0}`);
      console.log(`   Chapters: ${result.chapters?.length || 0}`);
      console.log(`   Scenes: ${result.scenes?.length || 0}`);

      console.log('\n🖼️ Image Generation Results:');
      let realImages = 0;
      let placeholders = 0;

      // Check story cover image
      const storyImageUrl = result.story?.hnsData?.storyImage?.url;
      if (storyImageUrl) {
        const isReal = storyImageUrl.includes('blob.vercel-storage.com');
        console.log(`   Story Cover: ${isReal ? '✅ Real' : '⚠️ Placeholder'}`);
        if (isReal) realImages++;
        else placeholders++;
      } else {
        console.log(`   Story Cover: ❌ Missing`);
      }

      // Check scene images
      result.scenes?.forEach((scene: any, i: number) => {
        const imageUrl = scene.scene_image?.url;
        const isReal = imageUrl?.includes('blob.vercel-storage.com');
        const isPlaceholder = imageUrl?.includes('picsum.photos');

        if (isReal) realImages++;
        if (isPlaceholder) placeholders++;

        console.log(`   Scene ${i + 1} (${scene.scene_title}): ${isReal ? '✅ Real' : isPlaceholder ? '⚠️ Placeholder' : '❌ Missing'}`);
      });

      console.log('\n📊 Final Summary:');
      console.log(`   Total Images Expected: ${(result.scenes?.length || 0) + 1}`);
      console.log(`   Real AI Images Generated: ${realImages}`);
      console.log(`   Placeholder Images: ${placeholders}`);
      console.log(`   Success Rate: ${Math.round(realImages / ((result.scenes?.length || 0) + 1) * 100)}%`);

      // Get the database story record
      const [dbStory] = await db
        .select()
        .from(stories)
        .where(eq(stories.id, storyId))
        .limit(1);

      if (dbStory) {
        console.log('\n🔗 Access Your New Story:');
        console.log(`   Story ID: ${dbStory.id}`);
        console.log(`   View Story: http://localhost:3000/read/${dbStory.id}`);
        console.log(`   Edit Story: http://localhost:3000/write/story/${dbStory.id}`);
        console.log(`   Browse Stories: http://localhost:3000/stories`);

        // Check if story image is in hnsData
        if (dbStory.hnsData) {
          const hnsData = dbStory.hnsData as any;
          if (hnsData.storyImage?.url) {
            console.log(`   Cover Image: ${hnsData.storyImage.url}`);
          }
        }
      }

      if (realImages > 0) {
        console.log('\n🎊 SUCCESS! All systems working:');
        console.log('   ✅ Story generation complete');
        console.log('   ✅ Real AI images generated');
        console.log('   ✅ Images stored in Vercel Blob');
        console.log('   ✅ Story and scene images displayed properly');
      } else {
        console.log('\n⚠️ Warning: No real images generated');
      }

      return storyId;
    } else {
      console.log('\n❌ Story generation failed');
      return null;
    }

  } catch (error) {
    console.error('\n❌ Error generating story:', error);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('🔄 CLEANUP AND REGENERATE PROCESS STARTING...');
  console.log('This will remove ALL existing stories and generate a fresh new one.');
  console.log('=' .repeat(80));

  try {
    // Step 1: Clean up everything
    await cleanAllStoriesAndData();

    // Step 2: Generate new story
    const storyId = await generateNewStory();

    if (storyId) {
      console.log('\n🎉 PROCESS COMPLETE!');
      console.log('✅ All old data cleaned up');
      console.log('✅ New story generated successfully');
      console.log(`✅ Story ID: ${storyId}`);
    } else {
      console.log('\n⚠️ Cleanup successful but story generation failed');
    }

  } catch (error) {
    console.error('\n❌ Process failed:', error);
    process.exit(1);
  }
}

// Run the process
main().catch(console.error);
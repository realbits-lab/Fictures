#!/usr/bin/env npx tsx

import { db } from '@/lib/db';
import { stories, scenes, chapters } from '@/lib/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';

async function checkSceneImages() {
  const latestStory = await db
    .select()
    .from(stories)
    .orderBy(desc(stories.createdAt))
    .limit(1);

  if (latestStory.length > 0) {
    const story = latestStory[0];
    console.log('📖 Latest story:', story.title);
    console.log('   Story ID:', story.id);
    console.log('   Status:', story.status);
    console.log('   Created:', story.createdAt);

    // Get chapters for this story
    const storyChapters = await db
      .select({ id: chapters.id })
      .from(chapters)
      .where(eq(chapters.storyId, story.id));

    if (storyChapters.length === 0) {
      console.log('   No chapters found for this story');
      return;
    }

    const chapterIds = storyChapters.map(c => c.id);

    // Get scenes for these chapters
    const storyScenes = await db
      .select()
      .from(scenes)
      .where(inArray(scenes.chapterId, chapterIds));

    console.log('\n🎬 Scene Image Analysis:');
    console.log('=' .repeat(60));

    let imagesCount = 0;
    let placeholderCount = 0;

    storyScenes.forEach((scene, i) => {
      // No imageUrl field in scenes table - images are in hnsData
      const hasImage = false;
      const isPlaceholder = false;

      if (hasImage) {
        imagesCount++;
        if (isPlaceholder) placeholderCount++;
      }

      // Check HNS data for scene_image field
      let hasHnsImage = false;
      let hnsImageUrl = '';
      if (scene.hnsData && typeof scene.hnsData === 'object') {
        const hns = scene.hnsData as any;
        if (hns.scene_image?.url) {
          hasHnsImage = true;
          hnsImageUrl = hns.scene_image.url;
        }
      }

      console.log(`\n  Scene ${i + 1}: ${scene.title}`);
      console.log(`    DB Image URL: ${hasImage ? (isPlaceholder ? '✅ (placeholder)' : '✅ (real)') : '❌'}`);
      console.log(`    HNS Image: ${hasHnsImage ? '✅' : '❌'}`);
      if (hasHnsImage && hnsImageUrl) {
        console.log(`    HNS URL: ${hnsImageUrl.substring(0, 50)}...`);
      }
    });

    console.log('\n' + '=' .repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total Scenes: ${storyScenes.length}`);
    console.log(`   Scenes with DB images: ${imagesCount} (${Math.round(imagesCount/storyScenes.length * 100)}%)`);
    console.log(`   Real images: ${imagesCount - placeholderCount}`);
    console.log(`   Placeholders: ${placeholderCount}`);

    const allHaveImages = storyScenes.every(s => {
      if (s.hnsData && typeof s.hnsData === 'object') {
        const hns = s.hnsData as any;
        return !!hns.scene_image?.url;
      }
      return false;
    });

    console.log(`\n✅ Mandatory Image Implementation: ${allHaveImages ? 'WORKING' : 'NOT WORKING'}`);
    console.log('   Note: Using placeholders when Gemini fails is expected behavior');
  } else {
    console.log('❌ No stories found in database');
  }
}

checkSceneImages().catch(console.error);
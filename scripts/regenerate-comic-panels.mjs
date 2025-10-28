#!/usr/bin/env node

/**
 * Regenerate Comic Panels
 *
 * This script regenerates comic panels for existing scenes with updated 7:4 aspect ratio prompts.
 * It deletes existing panels and regenerates them with the corrected white background instructions.
 */

import { db } from '../src/lib/db/index.ts';
import { stories, scenes, comicPanels } from '../src/lib/db/schema.ts';
import { eq, isNotNull } from 'drizzle-orm';
import { generateComicPanels } from '../src/lib/ai/comic-panel-generator.ts';
import fs from 'fs';

// Load authentication
const authPath = '.auth/user.json';
if (!fs.existsSync(authPath)) {
  console.error('❌ Authentication file not found at .auth/user.json');
  console.error('   Please run authentication setup first.');
  process.exit(1);
}

const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const sessionCookie = auth.cookies?.find(c => c.name === 'authjs.session-token');

if (!sessionCookie) {
  console.error('❌ No session token found in .auth/user.json');
  process.exit(1);
}

console.log('✓ Using authenticated session from .auth/user.json\n');

async function main() {
  try {
    // Find all scenes with generated comics
    console.log('🔍 Finding scenes with comic panels...\n');

    const scenesWithComics = await db.select({
      sceneId: scenes.id,
      sceneTitle: scenes.title,
      sceneContent: scenes.content,
      storyId: scenes.storyId,
      comicStatus: scenes.comicStatus,
      panelCount: scenes.comicPanelCount,
    })
    .from(scenes)
    .where(isNotNull(scenes.comicGeneratedAt))
    .limit(20);

    if (scenesWithComics.length === 0) {
      console.log('ℹ️  No scenes with comic panels found.');
      return;
    }

    console.log(`Found ${scenesWithComics.length} scene(s) with comic panels:\n`);
    scenesWithComics.forEach((scene, idx) => {
      console.log(`${idx + 1}. ${scene.sceneTitle || 'Untitled'} (${scene.panelCount || 0} panels)`);
      console.log(`   Scene ID: ${scene.sceneId}`);
      console.log(`   Story ID: ${scene.storyId}`);
      console.log(`   Status: ${scene.comicStatus}\n`);
    });

    // Ask for confirmation
    const sceneId = process.argv[2];

    if (!sceneId) {
      console.log('\n📋 Usage:');
      console.log('   node scripts/regenerate-comic-panels.mjs <sceneId>');
      console.log('\nExample:');
      console.log(`   node scripts/regenerate-comic-panels.mjs ${scenesWithComics[0].sceneId}`);
      return;
    }

    const targetScene = scenesWithComics.find(s => s.sceneId === sceneId);
    if (!targetScene) {
      console.error(`❌ Scene ${sceneId} not found or has no comic panels.`);
      return;
    }

    console.log(`\n🎬 Regenerating comic panels for: ${targetScene.sceneTitle || 'Untitled'}`);
    console.log(`   Scene ID: ${sceneId}`);
    console.log(`   Current panels: ${targetScene.panelCount || 0}\n`);

    // Fetch full scene data with characters and setting
    const [sceneData] = await db
      .select()
      .from(scenes)
      .where(eq(scenes.id, sceneId));

    if (!sceneData) {
      console.error('❌ Could not load scene data');
      return;
    }

    // Fetch story data
    const [storyData] = await db
      .select()
      .from(stories)
      .where(eq(stories.id, targetScene.storyId));

    if (!storyData) {
      console.error('❌ Could not load story data');
      return;
    }

    // Delete existing comic panels
    console.log('🗑️  Deleting existing comic panels...');
    const deleteResult = await db
      .delete(comicPanels)
      .where(eq(comicPanels.sceneId, sceneId));

    console.log(`✓ Deleted existing panels\n`);

    // Regenerate comic panels
    console.log('🎨 Regenerating comic panels with updated 7:4 aspect ratio prompts...\n');

    const result = await generateComicPanels({
      sceneId: sceneId,
      scene: sceneData,
      characters: [], // Will be fetched inside generateComicPanels if needed
      setting: { mood: sceneData.metadata?.mood || 'neutral' }, // Minimal setting
      story: {
        story_id: storyData.id,
        genre: storyData.genre || 'Science Fiction'
      },
      progressCallback: (current, total, status) => {
        console.log(`[${current}%] ${status}`);
      }
    });

    console.log('\n✅ Comic panel regeneration complete!');
    console.log(`   Panels generated: ${result.panels.length}`);
    console.log(`   Total height: ${result.metadata.total_height}px`);
    console.log(`   Reading time: ${result.metadata.estimated_reading_time}`);
    console.log(`   Generation time: ${(result.metadata.total_generation_time / 1000).toFixed(2)}s`);

  } catch (error) {
    console.error('\n❌ Error during regeneration:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

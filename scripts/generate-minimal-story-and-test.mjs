#!/usr/bin/env node

/**
 * Generate Minimal Story and Test Toonplay Evaluation
 *
 * Generates a minimal story (1 part, 1 chapter, 1 scene, 2 characters, 1 setting)
 * Then tests toonplay generation with quality evaluation on that scene.
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/generate-minimal-story-and-test.mjs
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const managerJsonPath = join(__dirname, '..', '.auth', 'manager.json');

// Load manager credentials
let USER_COOKIES;
let USER_EMAIL;
try {
  const managerData = JSON.parse(readFileSync(managerJsonPath, 'utf8'));
  USER_COOKIES = managerData.cookies;
  USER_EMAIL = managerData.email;

  if (!USER_COOKIES || USER_COOKIES.length === 0) {
    throw new Error('No cookies found in .auth/manager.json');
  }

  console.log(`✅ Loaded credentials for: ${USER_EMAIL}`);
} catch (error) {
  console.error('❌ Error loading manager credentials:', error.message);
  console.error('   Ensure .auth/manager.json exists with valid session cookies');
  process.exit(1);
}

function cookiesToString(cookies) {
  return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

const apiUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
const cookieString = cookiesToString(USER_COOKIES);

async function generateMinimalStory() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  MINIMAL STORY GENERATION + TOONPLAY TEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📝 Configuration:');
  console.log('   Parts: 1');
  console.log('   Chapters per Part: 1');
  console.log('   Scenes per Chapter: 1');
  console.log('   Characters: 2');
  console.log('   Settings: 1\n');

  const storyPrompt = "A data analyst discovers patterns that predict the future but faces moral dilemmas about changing fate";

  console.log('📖 Story Prompt:');
  console.log(`   ${storyPrompt}\n`);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  PHASE 1: GENERATING STORY');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    const response = await fetch(`${apiUrl}/studio/api/novels/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString
      },
      body: JSON.stringify({
        userPrompt: storyPrompt,
        preferredGenre: 'science fiction thriller',
        preferredTone: 'suspenseful',
        characterCount: 2,
        settingCount: 1,
        partsCount: 1,
        chaptersPerPart: 1,
        scenesPerChapter: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    // Read SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let storyId = null;
    let sceneId = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'phase_start') {
              console.log(`\n🔄 ${data.phase}: ${data.message}`);
            } else if (data.type === 'phase_complete') {
              console.log(`   ✅ ${data.phase} complete`);
            } else if (data.type === 'progress') {
              console.log(`   📊 ${data.message}`);
            } else if (data.type === 'story_created') {
              storyId = data.storyId;
              console.log(`\n   📚 Story Created: ${data.title}`);
              console.log(`   🆔 Story ID: ${storyId}`);
            } else if (data.type === 'scene_created' && !sceneId) {
              sceneId = data.sceneId;
              console.log(`   🎬 Scene Created: ${data.sceneTitle}`);
              console.log(`   🆔 Scene ID: ${sceneId}`);
            } else if (data.type === 'complete') {
              console.log('\n✅ Story generation complete!');
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    if (!storyId || !sceneId) {
      throw new Error('Failed to get story or scene ID from generation');
    }

    // Wait a moment for database to settle
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  PHASE 2: GENERATING COMIC PANELS WITH TOONPLAY EVALUATION');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`🎨 Generating comic panels for scene: ${sceneId}\n`);

    const comicStartTime = Date.now();

    const comicResponse = await fetch(`${apiUrl}/api/scenes/${sceneId}/comic/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString
      },
      body: JSON.stringify({
        targetPanelCount: 10,
        regenerate: false,
      }),
    });

    if (!comicResponse.ok) {
      const errorText = await comicResponse.text();
      throw new Error(`Comic generation failed: ${comicResponse.status} - ${errorText}`);
    }

    const comicResult = await comicResponse.json();
    const comicDuration = Date.now() - comicStartTime;

    console.log(`✅ Comic generation completed in ${(comicDuration / 1000).toFixed(2)}s\n`);

    // Display toonplay evaluation results
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  TOONPLAY QUALITY EVALUATION RESULTS');
    console.log('═══════════════════════════════════════════════════════════\n');

    if (comicResult.result.evaluation) {
      const eval_ = comicResult.result.evaluation;

      console.log('📊 QUALITY METRICS:');
      console.log(`   Score: ${eval_.weighted_score.toFixed(2)}/5.0`);
      console.log(`   Status: ${eval_.passes ? '✅ PASSES' : '⚠️  NEEDS IMPROVEMENT'}`);
      console.log(`   Iterations: ${eval_.iterations}`);

      console.log('\n📋 TOONPLAY DETAILS:');
      console.log(`   Total Panels: ${comicResult.result.toonplay.total_panels}`);
      console.log(`   Scene: ${comicResult.result.toonplay.scene_title}`);

      // Analyze panel text distribution
      const panels = comicResult.result.toonplay.panels;
      const panelsWithNarrative = panels.filter(p => p.narrative && p.narrative.trim().length > 0).length;
      const panelsWithDialogue = panels.filter(p => p.dialogue && p.dialogue.length > 0).length;
      const panelsWithNeither = panels.filter(p =>
        (!p.narrative || p.narrative.trim().length === 0) &&
        (!p.dialogue || p.dialogue.length === 0)
      ).length;

      const narrationPercentage = (panelsWithNarrative / panels.length) * 100;

      console.log('\n📊 CONTENT DISTRIBUTION:');
      console.log(`   Panels with Narrative: ${panelsWithNarrative}/${panels.length} (${narrationPercentage.toFixed(1)}%)`);
      console.log(`   Panels with Dialogue: ${panelsWithDialogue}/${panels.length} (${((panelsWithDialogue / panels.length) * 100).toFixed(1)}%)`);
      console.log(`   Panels with NO TEXT: ${panelsWithNeither} ${panelsWithNeither === 0 ? '✅' : '❌ CRITICAL ERROR'}`);

      console.log('\n🎯 TARGET COMPLIANCE:');
      console.log(`   Narration <5%: ${narrationPercentage < 5 ? '✅ PASS' : `❌ FAIL (${narrationPercentage.toFixed(1)}%)`}`);
      console.log(`   All panels have text: ${panelsWithNeither === 0 ? '✅ PASS' : '❌ FAIL'}`);

      // Shot type distribution
      const shotTypes = {};
      panels.forEach(p => {
        shotTypes[p.shot_type] = (shotTypes[p.shot_type] || 0) + 1;
      });

      console.log('\n🎬 SHOT TYPE DISTRIBUTION:');
      Object.entries(shotTypes).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });

      // Display full evaluation report
      console.log('\n' + '═'.repeat(60));
      console.log(eval_.final_report);

    } else {
      console.log('⚠️  No evaluation data found in response');
      console.log('   This indicates the evaluation system may not be active');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  FINAL SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('✅ Story Generation: SUCCESS');
    console.log(`   Story ID: ${storyId}`);
    console.log(`   Scene ID: ${sceneId}`);

    console.log('\n✅ Toonplay Generation: SUCCESS');
    if (comicResult.result.evaluation) {
      console.log(`   Quality Score: ${comicResult.result.evaluation.weighted_score.toFixed(2)}/5.0`);
      console.log(`   Status: ${comicResult.result.evaluation.passes ? 'PASSES' : 'NEEDS IMPROVEMENT'}`);
      console.log(`   Iterations: ${comicResult.result.evaluation.iterations}`);
    }
    console.log(`   Total Panels: ${comicResult.result.toonplay.total_panels}`);
    console.log(`   Generation Time: ${(comicDuration / 1000).toFixed(2)}s`);

    console.log('\n📖 View Story:');
    console.log(`   Novel: ${apiUrl}/novels/${storyId}`);
    console.log(`   Comic: ${apiUrl}/comics/${storyId}`);
    console.log(`   Edit: ${apiUrl}/studio/edit/story/${storyId}`);

    console.log('\n═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
generateMinimalStory();

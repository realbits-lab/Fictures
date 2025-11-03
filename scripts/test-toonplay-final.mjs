#!/usr/bin/env node

/**
 * Test Toonplay Generation with Quality Evaluation
 *
 * Tests the improved toonplay generation system with the following features:
 * - Automatic quality evaluation using "Architectonics of Engagement" framework
 * - Iterative improvement loop (max 2 iterations)
 * - 4-category scoring (3.0/5.0 passing threshold)
 * - Content distribution analysis
 * - Shot type breakdown
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/test-toonplay-final.mjs
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

const storyId = 'xCMMeATNbQY_4eIilxH22';
const sceneId = '3P5In-JVrkd3tlc9E_Q8R';

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  TOONPLAY GENERATION WITH QUALITY EVALUATION TEST');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`🎬 Story ID: ${storyId}`);
console.log(`🎬 Scene ID: ${sceneId}\n`);

console.log('🎨 Generating comic panels with toonplay evaluation...\n');

try {
  const response = await fetch(`${apiUrl}/api/scenes/${sceneId}/comic/generate`, {
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Comic generation failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  console.log('✅ Comic generation completed!\n');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TOONPLAY QUALITY EVALUATION RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (result.result.evaluation) {
    const eval_ = result.result.evaluation;

    console.log('📊 QUALITY METRICS:');
    console.log(`   Score: ${eval_.weighted_score.toFixed(2)}/5.0`);
    console.log(`   Status: ${eval_.passes ? '✅ PASSES' : '⚠️  NEEDS IMPROVEMENT'}`);
    console.log(`   Iterations: ${eval_.iterations}`);

    console.log('\n📋 TOONPLAY DETAILS:');
    console.log(`   Total Panels: ${result.result.toonplay.total_panels}`);
    console.log(`   Scene: ${result.result.toonplay.scene_title}`);

    // Analyze panel text distribution
    const panels = result.result.toonplay.panels;
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
  console.log('  TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');

} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
}

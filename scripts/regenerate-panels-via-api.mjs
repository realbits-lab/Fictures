#!/usr/bin/env node

/**
 * Regenerate Comic Panels via API
 *
 * Uses the /api/scenes/[id]/comic/generate endpoint with regenerate=true
 */

import fs from 'fs';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

// Load authentication
const authPath = '.auth/user.json';
if (!fs.existsSync(authPath)) {
  console.error('❌ Authentication file not found at .auth/user.json');
  process.exit(1);
}

const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));

// Support both old format (cookies at root) and new format (profiles.manager.cookies)
const cookies = auth.cookies || auth.profiles?.manager?.cookies;

if (!cookies) {
  console.error('❌ No cookies found in .auth/user.json');
  process.exit(1);
}

const sessionCookie = cookies.find(c => c.name === 'authjs.session-token');

if (!sessionCookie) {
  console.error('❌ No session token found in cookies');
  process.exit(1);
}

const cookieHeader = `${sessionCookie.name}=${sessionCookie.value}`;

async function findScenesWithComics() {
  console.log('🔍 Finding scenes with comic panels...\n');

  // We'll need to query this from the frontend or create an API endpoint
  // For now, let's use a known scene ID from the command line
  const sceneId = process.argv[2];

  if (!sceneId) {
    console.log('📋 Usage:');
    console.log('   node scripts/regenerate-panels-via-api.mjs <sceneId>');
    console.log('\nTo find scene IDs, check your database or Studio UI.');
    return null;
  }

  return sceneId;
}

async function regenerateComicPanels(sceneId) {
  console.log(`\n🎨 Regenerating comic panels for scene: ${sceneId}\n`);

  try {
    const response = await fetch(`${BASE_URL}/api/scenes/${sceneId}/comic/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({
        regenerate: true, // Force regeneration
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ API Error (${response.status}):`, error.error || error.message);
      return;
    }

    const result = await response.json();

    console.log('\n✅ Comic panel regeneration complete!');
    console.log(`   Scene: ${result.scene.title}`);
    console.log(`   Panels generated: ${result.scene.comicPanelCount}`);
    console.log(`   Status: ${result.scene.comicStatus}`);
    console.log(`   Version: ${result.scene.comicVersion}`);
    console.log(`   Generation time: ${(result.result.metadata.total_generation_time / 1000).toFixed(2)}s`);
    console.log(`   Total height: ${result.result.metadata.total_height}px`);
    console.log(`   Reading time: ${result.result.metadata.estimated_reading_time}`);

    console.log('\n📊 Panel Details:');
    result.result.panels.forEach((panel, idx) => {
      console.log(`   ${idx + 1}. Panel ${panel.panel_number}: ${panel.shot_type}`);
      console.log(`      Image: ${panel.image_url.substring(0, 60)}...`);
      if (panel.narrative) {
        console.log(`      Narrative: ${panel.narrative.substring(0, 50)}...`);
      }
      if (panel.dialogue && panel.dialogue.length > 0) {
        console.log(`      Dialogue: ${panel.dialogue.length} line(s)`);
      }
    });

  } catch (error) {
    console.error('\n❌ Error during regeneration:', error.message);
    process.exit(1);
  }
}

async function main() {
  const sceneId = await findScenesWithComics();

  if (!sceneId) {
    return;
  }

  await regenerateComicPanels(sceneId);
}

main();

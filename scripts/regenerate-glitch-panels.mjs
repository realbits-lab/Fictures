#!/usr/bin/env node

/**
 * Regenerate ALL 3 panels for "The Glitch in the Machine" scene
 * with complete image optimization (18 variants per panel)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Scene ID for "The Glitch in the Machine"
const SCENE_ID = 's25ARzn_TttzuO9r5lvX3';
const STORY_ID = '3JpLdcXb5hQK7zy5g3QIj';

// Read authentication from .auth/user.json
const AUTH_FILE_PATH = join(__dirname, '../.auth/user.json');
let authHeaders = {};

try {
  const authData = JSON.parse(readFileSync(AUTH_FILE_PATH, 'utf-8'));
  const profile = authData.profiles?.writer;

  if (!profile) {
    throw new Error('Writer profile not found');
  }

  // Use API key authentication
  if (!profile.apiKey) {
    throw new Error('No API key found in writer profile');
  }

  authHeaders = {
    'Authorization': `Bearer ${profile.apiKey}`,
  };

  console.log(`✓ Loaded authentication: ${profile.email} (${profile.role})`);
  console.log(`✓ Using API key authentication with scopes: ${profile.apiKeyScopes?.join(', ')}\n`);
} catch (error) {
  console.error('✗ Failed to load authentication:', error.message);
  process.exit(1);
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function regeneratePanels() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  COMPLETE Panel Regeneration: "The Glitch in the Machine"');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Scene ID: ${SCENE_ID}`);
  console.log(`Story ID: ${STORY_ID}\n`);

  try {
    console.log('🎨 Starting COMPLETE panel regeneration (delete + regenerate)...\n');

    const response = await fetch(`${BASE_URL}/api/comic/generate-panels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        sceneId: SCENE_ID,
        targetPanelCount: 3,
        regenerate: true, // Delete existing and regenerate
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${response.status} - ${errorData.error || response.statusText}`);
    }

    // Process SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult = null;

    console.log('📡 Streaming progress updates...\n');

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        const data = JSON.parse(line.slice(6));

        switch (data.type) {
          case 'start':
            console.log(`🚀 ${data.message}`);
            break;
          case 'progress':
            console.log(`   [${data.current}/${data.total}] ${data.status}`);
            break;
          case 'complete':
            console.log('\n✅ Generation complete!\n');
            finalResult = data.result;
            break;
          case 'error':
            throw new Error(data.error);
        }
      }
    }

    if (!finalResult) {
      throw new Error('No result received from generation');
    }

    console.log('📊 Results:');
    console.log(`  Screenplay: ${finalResult.screenplay ? 'Generated' : 'Missing'}`);
    console.log(`  Panels generated: ${finalResult.panels?.length || 0}\n`);

    if (finalResult.panels) {
      console.log('🎬 Panels:\n');
      finalResult.panels.forEach((panel, idx) => {
        console.log(`  Panel ${idx + 1}/${finalResult.panels.length}:`);
        console.log(`    Shot type: ${panel.shot_type}`);
        console.log(`    Image: ${panel.image_url ? '✓ Generated' : '✗ Missing'}`);
        console.log(`    Dialogue: ${panel.dialogue?.length || 0} lines`);
        console.log(`    SFX: ${panel.sfx?.length || 0} effects`);
        console.log(`    Gutter: ${panel.gutter_after}px\n`);
      });
    }

    // Verify panels
    console.log('🔍 Verifying panels...');
    const verifyResponse = await fetch(`${BASE_URL}/api/comic/${SCENE_ID}/panels`, {
      headers: authHeaders,
    });

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log(`✅ Verified ${verifyData.panels?.length || 0} panels in database`);
      console.log(`   Total height: ${verifyData.metadata?.total_height || 0}px`);
      console.log(`   Reading time: ${verifyData.metadata?.estimated_reading_time || 'N/A'}`);
      console.log(`   Pacing: ${verifyData.metadata?.pacing || 'N/A'}\n`);
    }

    console.log('✅ SUCCESS!\n');
    console.log(`🔗 View comics at: ${BASE_URL}/comics/${STORY_ID}`);

  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

regeneratePanels();

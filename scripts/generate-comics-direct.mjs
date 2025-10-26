#!/usr/bin/env node

/**
 * Generate Comics for Scene ID
 *
 * Direct comics generation using scene ID with proper authentication
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Scene ID from database search
const SCENE_ID = 's25ARzn_TttzuO9r5lvX3'; // "The Glitch in the Machine"

// Read authentication from .auth/user.json - USE WRITER PROFILE
const AUTH_FILE_PATH = join(__dirname, '../.auth/user.json');
const authData = JSON.parse(readFileSync(AUTH_FILE_PATH, 'utf-8'));
const writerProfile = authData.profiles.writer; // Use writer, not manager
const apiKey = writerProfile.apiKey;

const BASE_URL = 'http://localhost:3000';

console.log('══════════════════════════════════════════════════════');
console.log('  Comic Panel Generation for "The Glitch in the Machine"');
console.log('══════════════════════════════════════════════════════\n');
console.log(`Scene ID: ${SCENE_ID}`);
console.log(`Using profile: writer (${writerProfile.email})`);
console.log(`API Key: ${apiKey.substring(0, 20)}...`);
console.log('');

async function generateComics() {
  try {
    console.log('🎨 Starting comics generation...\n');

    const response = await fetch(`${BASE_URL}/api/comic/generate-panels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        sceneId: SCENE_ID,
        targetPanelCount: 3,
        regenerate: true, // Force regenerate if panels exist
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
            console.log('\n✅ Generation complete!');
            finalResult = data.result;
            break;
          case 'error':
            throw new Error(data.error);
        }
      }
    }

    if (!finalResult) {
      throw new Error('No result received');
    }

    // Display results
    console.log('\n📊 Results:');
    console.log(`  Screenplay length: ${finalResult.screenplay?.length || 0} chars`);
    console.log(`  Panels generated: ${finalResult.panels?.length || 0}`);

    if (finalResult.panels) {
      console.log('\n🎬 Panels:');
      finalResult.panels.forEach((panel, idx) => {
        console.log(`\n  Panel ${idx + 1}/${finalResult.panels.length}:`);
        console.log(`    Shot type: ${panel.shot_type}`);
        console.log(`    Image: ${panel.image_url ? '✓ Generated' : '✗ Missing'}`);
        console.log(`    Dialogue: ${panel.dialogue?.length || 0} lines`);
        console.log(`    SFX: ${panel.sfx?.length || 0} effects`);
        console.log(`    Gutter: ${panel.gutter_after}px`);
      });
    }

    // Verify panels
    console.log('\n🔍 Verifying panels...');
    const verifyResponse = await fetch(`${BASE_URL}/api/comic/${SCENE_ID}/panels`, {
      headers: { 'X-API-Key': apiKey }
    });

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log(`✅ Verified ${verifyData.panels?.length || 0} panels in database`);
      console.log(`   Total height: ${verifyData.metadata?.total_height || 0}px`);
      console.log(`   Reading time: ${verifyData.metadata?.estimated_reading_time || 'N/A'}`);
      console.log(`   Pacing: ${verifyData.metadata?.pacing || 'N/A'}`);
    }

    console.log('\n✅ SUCCESS!');
    console.log(`\n🔗 View comics at: ${BASE_URL}/comics/3JpLdcXb5hQK7zy5g3QIj`);

  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

generateComics();

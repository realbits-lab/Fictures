#!/usr/bin/env node

/**
 * Generate Comics for "The Glitch in the Machine" Scene
 *
 * This script finds the scene and generates comic panels using the comics API.
 * Features:
 * - Automatic scene search by title
 * - Error handling with retry logic
 * - Progress monitoring via SSE
 * - Detailed logging
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read authentication from .auth/user.json
const AUTH_FILE_PATH = join(__dirname, '../.auth/user.json');
let authCookies = '';

try {
  const authData = JSON.parse(readFileSync(AUTH_FILE_PATH, 'utf-8'));

  // Handle profile-based auth structure
  const profile = authData.profiles?.[authData.defaultProfile] || authData.profiles?.manager;

  if (!profile || !profile.cookies || profile.cookies.length === 0) {
    throw new Error('No cookies found in the selected profile');
  }

  authCookies = profile.cookies
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');

  console.log(`✓ Loaded authentication from .auth/user.json (${authData.defaultProfile || 'manager'} profile)`);
} catch (error) {
  console.error('✗ Failed to load authentication:', error.message);
  console.log('\nPlease ensure .auth/user.json exists with valid session.');
  process.exit(1);
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Search for scene by title pattern
 */
async function findScene(titlePattern) {
  console.log(`\n📖 Searching for scene: "${titlePattern}"`);

  try {
    const response = await fetch(`${BASE_URL}/api/scenes/search?q=${encodeURIComponent(titlePattern)}`, {
      method: 'GET',
      headers: {
        'Cookie': authCookies,
      },
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.scenes || data.scenes.length === 0) {
      return null;
    }

    // Return the first matching scene
    return data.scenes[0];
  } catch (error) {
    console.error('✗ Scene search error:', error.message);
    throw error;
  }
}

/**
 * Fetch all scenes and find by title match (fallback method)
 */
async function findSceneByTitle(titlePattern) {
  console.log(`\n📖 Searching for scene with title pattern: "${titlePattern}"`);

  try {
    // Get all stories first
    const storiesResponse = await fetch(`${BASE_URL}/api/stories`, {
      method: 'GET',
      headers: {
        'Cookie': authCookies,
      },
    });

    if (!storiesResponse.ok) {
      throw new Error(`Stories fetch failed: ${storiesResponse.status}`);
    }

    const storiesData = await storiesResponse.json();

    // Handle different response structures
    const stories = Array.isArray(storiesData) ? storiesData : (storiesData.stories || []);

    console.log(`✓ Found ${stories.length} stories`);

    // Search through each story's chapters and scenes
    for (const story of stories) {
      const storyResponse = await fetch(`${BASE_URL}/api/stories/${story.id}`, {
        method: 'GET',
        headers: {
          'Cookie': authCookies,
        },
      });

      if (!storyResponse.ok) continue;

      const storyData = await storyResponse.json();

      if (!storyData.chapters) continue;

      for (const chapter of storyData.chapters) {
        if (!chapter.scenes) continue;

        for (const scene of chapter.scenes) {
          if (scene.title && scene.title.toLowerCase().includes(titlePattern.toLowerCase())) {
            console.log(`✓ Found scene: "${scene.title}" (ID: ${scene.id})`);
            console.log(`  Story: ${storyData.title}`);
            console.log(`  Chapter: ${chapter.title}`);
            return {
              ...scene,
              chapter,
              story: storyData
            };
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('✗ Scene search error:', error.message);
    throw error;
  }
}

/**
 * Generate comic panels for a scene with retry logic
 */
async function generateComicPanels(sceneId, retryCount = 0) {
  console.log(`\n🎨 Generating comic panels for scene: ${sceneId}`);
  console.log(`   Attempt: ${retryCount + 1}/${MAX_RETRIES + 1}`);

  try {
    const response = await fetch(`${BASE_URL}/api/comic/generate-panels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookies,
      },
      body: JSON.stringify({
        sceneId,
        targetPanelCount: 3, // Generate 3 panels
        regenerate: retryCount > 0, // Regenerate on retry
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

    console.log('\n📡 Streaming progress updates...\n');

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
      throw new Error('No result received from generation');
    }

    return finalResult;

  } catch (error) {
    console.error(`✗ Generation failed: ${error.message}`);

    if (retryCount < MAX_RETRIES) {
      console.log(`\n⏳ Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await sleep(RETRY_DELAY_MS);
      return generateComicPanels(sceneId, retryCount + 1);
    }

    throw new Error(`Failed after ${retryCount + 1} attempts: ${error.message}`);
  }
}

/**
 * Verify generated panels
 */
async function verifyPanels(sceneId) {
  console.log(`\n🔍 Verifying generated panels...`);

  try {
    const response = await fetch(`${BASE_URL}/api/comic/${sceneId}/panels`, {
      method: 'GET',
      headers: {
        'Cookie': authCookies,
      },
    });

    if (!response.ok) {
      throw new Error(`Verification failed: ${response.status}`);
    }

    const data = await response.json();

    console.log(`✓ Verified ${data.panels?.length || 0} panels`);
    console.log(`  Total height: ${data.metadata?.total_height || 0}px`);
    console.log(`  Reading time: ${data.metadata?.estimated_reading_time || 'N/A'}`);
    console.log(`  Pacing: ${data.metadata?.pacing || 'N/A'}`);

    return data;
  } catch (error) {
    console.error('✗ Verification failed:', error.message);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Comic Panel Generation: "The Glitch in the Machine"  ');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Step 1: Find the scene
    let scene = await findSceneByTitle('Glitch in the Machine');

    if (!scene) {
      console.error('\n✗ Scene not found!');
      console.log('  Please ensure a scene with "Glitch in the Machine" in the title exists.');
      process.exit(1);
    }

    console.log('\n✓ Scene found!');
    console.log(`  ID: ${scene.id}`);
    console.log(`  Title: ${scene.title}`);

    // Step 2: Generate comic panels
    const result = await generateComicPanels(scene.id);

    console.log('\n📊 Generation Results:');
    console.log(`  Screenplay length: ${result.screenplay?.length || 0} characters`);
    console.log(`  Panels generated: ${result.panels?.length || 0}`);

    if (result.panels) {
      result.panels.forEach((panel, idx) => {
        console.log(`\n  Panel ${idx + 1}:`);
        console.log(`    Shot type: ${panel.shot_type}`);
        console.log(`    Image: ${panel.image_url ? '✓' : '✗'}`);
        console.log(`    Dialogue lines: ${panel.dialogue?.length || 0}`);
        console.log(`    SFX: ${panel.sfx?.length || 0}`);
      });
    }

    // Step 3: Verify panels
    const verification = await verifyPanels(scene.id);

    if (verification && verification.panels?.length > 0) {
      console.log('\n✅ SUCCESS: Comic panels generated and verified!');
      console.log(`\n🔗 View comics at: ${BASE_URL}/comics/${scene.story?.id || 'unknown'}`);
    } else {
      console.log('\n⚠️  WARNING: Panels generated but verification failed');
    }

  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
main();

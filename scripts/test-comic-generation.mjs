/**
 * Test Comic Panel Generation
 *
 * Tests the comic generation pipeline for a random scene:
 * 1. Finds available stories with scenes
 * 2. Selects a random scene
 * 3. Generates comic panels via API
 * 4. Monitors progress and reports results
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// CONFIGURATION
// ========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const AUTH_FILE = path.join(__dirname, '..', '.auth', 'user.json');

// ========================================
// HELPER FUNCTIONS
// ========================================

function loadAuthData() {
  try {
    const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
    return authData;
  } catch (error) {
    console.error('❌ Failed to load authentication data from .auth/user.json');
    console.error('   Run: dotenv --file .env.local run node scripts/capture-auth-manual.mjs');
    process.exit(1);
  }
}

async function makeAuthenticatedRequest(url, options = {}) {
  const authData = loadAuthData();

  // Extract session cookie
  const sessionCookie = authData.cookies?.find(c => c.name.includes('session'));

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (sessionCookie) {
    headers['Cookie'] = `${sessionCookie.name}=${sessionCookie.value}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

async function getRandomScene() {
  console.log('\n🔍 Finding stories with scenes...');

  const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/stories`);

  if (!response.ok) {
    throw new Error(`Failed to fetch stories: ${response.status} ${response.statusText}`);
  }

  const stories = await response.json();

  if (!stories || stories.length === 0) {
    throw new Error('No stories found. Generate a story first.');
  }

  console.log(`   Found ${stories.length} stories`);

  // Get story details with scenes
  for (const story of stories) {
    const detailResponse = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/stories/${story.id}`
    );

    if (detailResponse.ok) {
      const storyDetails = await detailResponse.json();

      // Find scenes
      const scenes = storyDetails.parts
        ?.flatMap(part => part.chapters || [])
        ?.flatMap(chapter => chapter.scenes || [])
        ?.filter(scene => scene.content && scene.content.trim().length > 100);

      if (scenes && scenes.length > 0) {
        // Pick a random scene
        const randomScene = scenes[Math.floor(Math.random() * scenes.length)];

        console.log(`\n✅ Selected random scene:`);
        console.log(`   Story: ${storyDetails.title}`);
        console.log(`   Scene: ${randomScene.title || randomScene.sceneTitle}`);
        console.log(`   Scene ID: ${randomScene.id || randomScene.sceneId}`);
        console.log(`   Content Length: ${randomScene.content.length} chars`);

        return {
          sceneId: randomScene.id || randomScene.sceneId,
          sceneTitle: randomScene.title || randomScene.sceneTitle,
          storyTitle: storyDetails.title,
        };
      }
    }
  }

  throw new Error('No scenes found in any story');
}

async function generateComicPanels(sceneId, targetPanelCount = 3) {
  console.log(`\n🎨 Generating comic panels for scene...`);
  console.log(`   Scene ID: ${sceneId}`);
  console.log(`   Target Panel Count: ${targetPanelCount}`);

  const response = await makeAuthenticatedRequest(
    `${API_BASE_URL}/api/comic/generate-panels`,
    {
      method: 'POST',
      body: JSON.stringify({
        sceneId,
        targetPanelCount,
        regenerate: true, // Regenerate if panels already exist
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Comic generation failed: ${response.status} - ${error}`);
  }

  // Handle SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let lastProgress = null;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));

          if (data.type === 'progress') {
            lastProgress = data.data;
            console.log(`   [${data.data.current}/${data.data.total}] ${data.data.status}`);
          } else if (data.type === 'complete') {
            console.log(`\n✅ Comic generation complete!`);
            console.log(`   Panels Generated: ${data.data.panels.length}`);
            console.log(`   Total Height: ${data.data.metadata.total_height}px`);
            console.log(`   Estimated Reading Time: ${data.data.metadata.estimated_reading_time}`);
            console.log(`   Generation Time: ${(data.data.metadata.total_generation_time / 1000).toFixed(2)}s`);
            return data.data;
          } else if (data.type === 'error') {
            throw new Error(data.data.message);
          }
        }
      }
    }
  } catch (error) {
    reader.releaseLock();
    throw error;
  }
}

// ========================================
// MAIN TEST FUNCTION
// ========================================

async function testComicGeneration() {
  console.log('🧪 ============= COMIC GENERATION TEST START =============\n');

  const startTime = Date.now();

  try {
    // Step 1: Get random scene
    const { sceneId, sceneTitle, storyTitle } = await getRandomScene();

    // Step 2: Generate comic panels
    const result = await generateComicPanels(sceneId);

    const totalTime = Date.now() - startTime;

    console.log(`\n✅ ============= TEST COMPLETE =============`);
    console.log(`   Story: ${storyTitle}`);
    console.log(`   Scene: ${sceneTitle}`);
    console.log(`   Panels: ${result.panels.length}`);
    console.log(`   Total Test Time: ${(totalTime / 1000).toFixed(2)}s`);

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ ============= TEST FAILED =============`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  }
}

// ========================================
// RUN TEST
// ========================================

testComicGeneration();

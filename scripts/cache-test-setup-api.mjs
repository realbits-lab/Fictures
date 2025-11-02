#!/usr/bin/env node

/**
 * Cache Performance Test - Database Setup (API Version)
 *
 * Creates mockup test data via API for validating caching and optimization:
 * - Test stories with chapters and scenes
 * - Performance measurement baseline
 * - Cache invalidation testing
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  storyCount: 3,
  chaptersPerStory: 5,
  scenesPerChapter: 3,
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

// Load authentication
async function loadAuth() {
  const authPath = path.join(__dirname, '../.auth/user.json');
  try {
    const authData = await fs.readFile(authPath, 'utf-8');
    const auth = JSON.parse(authData);

    // Use writer profile
    const profile = auth.profiles?.writer;

    if (!profile) {
      throw new Error('Writer profile not found in .auth/user.json');
    }

    const sessionCookie = profile.cookies?.find(c =>
      c.name === 'authjs.session-token' || c.name === '__Secure-authjs.session-token'
    );

    if (!sessionCookie) {
      throw new Error('Session cookie not found in writer profile');
    }

    return { sessionCookie, userId: profile.userId, email: profile.email };
  } catch (error) {
    console.error('❌ Error loading authentication:', error.message);
    throw error;
  }
}

// Create a test story via API
async function createStory(auth, storyNumber) {
  const url = `${TEST_CONFIG.baseUrl}/api/stories`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `${auth.sessionCookie.name}=${auth.sessionCookie.value}`,
    },
    body: JSON.stringify({
      title: `Cache Test Story ${storyNumber}`,
      genre: 'fantasy',
      status: storyNumber === 1 ? 'published' : 'writing',
      summary: `This is a test story for cache performance testing. Story ${storyNumber} with chapters and scenes.`,
      tone: 'aspirational',
      moralFramework: {
        centralVirtue: 'courage',
        testedVirtues: ['honesty', 'perseverance'],
        consequencePattern: 'redemption',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create story: ${response.status} - ${error}`);
  }

  return response.json();
}

// Create a chapter via direct database insert (using internal API)
async function createChapter(auth, storyId, chapterNumber) {
  const url = `${TEST_CONFIG.baseUrl}/api/chapters`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `${auth.sessionCookie.name}=${auth.sessionCookie.value}`,
    },
    body: JSON.stringify({
      title: `Chapter ${chapterNumber}: Testing Cache Layer ${chapterNumber}`,
      summary: `This chapter tests caching behavior at layer ${chapterNumber}. It contains scenes with various content.`,
      storyId: storyId,
      orderIndex: chapterNumber,
      status: chapterNumber <= 3 ? 'published' : 'writing',
      arcPosition: chapterNumber / TEST_CONFIG.chaptersPerStory,
      adversityType: 'external',
      virtueType: 'courage',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create chapter: ${response.status} - ${error}`);
  }

  return response.json();
}

// Create a scene via API
async function createScene(auth, chapterId, sceneNumber, chapterNumber, storyNumber) {
  const url = `${TEST_CONFIG.baseUrl}/api/scenes`;

  const content = `This is scene ${sceneNumber} for cache testing.\n\n` +
    `It contains multiple paragraphs to simulate real content.\n\n` +
    `The scene is designed to test caching behavior across three layers:\n` +
    `1. SWR Memory Cache (30 minutes)\n` +
    `2. localStorage Cache (1 hour)\n` +
    `3. Redis Cache (10 minutes for public)\n\n` +
    `Each layer should be tested for cold and warm loads.\n\n` +
    `Scene ${sceneNumber} - Chapter ${chapterNumber} - Story ${storyNumber}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `${auth.sessionCookie.name}=${auth.sessionCookie.value}`,
    },
    body: JSON.stringify({
      title: `Scene ${sceneNumber}: Cache Test`,
      content: content,
      chapterId: chapterId,
      orderIndex: sceneNumber,
      status: 'published',
      visibility: sceneNumber === 1 ? 'public' : 'unlisted',
      cyclePhase: 'adversity',
      emotionalBeat: 'tension',
      wordCount: content.split(/\s+/).length,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create scene: ${response.status} - ${error}`);
  }

  return response.json();
}

// Clear previous test data
async function clearPreviousTestData(auth) {
  console.log('\n🗑️  Clearing previous test data...');

  try {
    // Get all stories for the user
    const url = `${TEST_CONFIG.baseUrl}/api/stories`;
    const response = await fetch(url, {
      headers: {
        'Cookie': `${auth.sessionCookie.name}=${auth.sessionCookie.value}`,
      },
    });

    if (!response.ok) {
      console.log('⚠️  Could not fetch stories for cleanup');
      return;
    }

    const data = await response.json();
    const stories = Array.isArray(data) ? data : (data.stories || []);
    const testStories = stories.filter(s => s.title?.startsWith('Cache Test Story'));

    if (testStories.length === 0) {
      console.log('✅ No previous test data found');
      return;
    }

    console.log(`  Found ${testStories.length} test stories to delete`);

    // Delete each test story
    for (const story of testStories) {
      const deleteUrl = `${TEST_CONFIG.baseUrl}/api/stories/${story.id}`;
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Cookie': `${auth.sessionCookie.name}=${auth.sessionCookie.value}`,
        },
      });

      if (deleteResponse.ok) {
        console.log(`  ✅ Deleted: ${story.title}`);
      } else {
        console.log(`  ⚠️  Failed to delete: ${story.title}`);
      }
    }

    console.log(`✅ Deleted ${testStories.length} test stories`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

// Verify test data
async function verifyTestData(auth) {
  console.log('\n✅ Verifying test data...');

  const url = `${TEST_CONFIG.baseUrl}/api/stories`;
  const response = await fetch(url, {
    headers: {
      'Cookie': `${auth.sessionCookie.name}=${auth.sessionCookie.value}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch stories for verification');
  }

  const data = await response.json();
  const stories = Array.isArray(data) ? data : (data.stories || []);
  const testStories = stories.filter(s => s.title?.startsWith('Cache Test Story'));

  console.log(`
📊 Test Data Summary:
  - Stories: ${testStories.length}
  - Expected Stories: ${TEST_CONFIG.storyCount}
  `);

  return testStories;
}

async function main() {
  console.log('🚀 Cache Performance Test - Database Setup\n');
  console.log('Configuration:');
  console.log(`  - Stories: ${TEST_CONFIG.storyCount}`);
  console.log(`  - Chapters per story: ${TEST_CONFIG.chaptersPerStory}`);
  console.log(`  - Scenes per chapter: ${TEST_CONFIG.scenesPerChapter}`);
  console.log(`  - Total chapters: ${TEST_CONFIG.storyCount * TEST_CONFIG.chaptersPerStory}`);
  console.log(`  - Total scenes: ${TEST_CONFIG.storyCount * TEST_CONFIG.chaptersPerStory * TEST_CONFIG.scenesPerChapter}`);

  try {
    // Load authentication
    console.log('\n🔐 Loading authentication...');
    const auth = await loadAuth();
    console.log(`✅ Authenticated as: ${auth.email}`);

    // Clear previous test data
    await clearPreviousTestData(auth);

    // Create test stories
    console.log(`\n📚 Creating ${TEST_CONFIG.storyCount} test stories...`);

    for (let i = 1; i <= TEST_CONFIG.storyCount; i++) {
      console.log(`\n  Story ${i}:`);
      const story = await createStory(auth, i);
      console.log(`    ✅ Created: ${story.id} (${story.status})`);

      // Create chapters
      console.log(`    📖 Creating ${TEST_CONFIG.chaptersPerStory} chapters...`);
      for (let j = 1; j <= TEST_CONFIG.chaptersPerStory; j++) {
        const chapter = await createChapter(auth, story.id, j);
        console.log(`      ✅ Chapter ${j}: ${chapter.id}`);

        // Create scenes
        console.log(`        🎬 Creating ${TEST_CONFIG.scenesPerChapter} scenes...`);
        for (let k = 1; k <= TEST_CONFIG.scenesPerChapter; k++) {
          const sceneNumber = (j - 1) * TEST_CONFIG.scenesPerChapter + k;
          await createScene(auth, chapter.id, sceneNumber, j, i);
        }
        console.log(`        ✅ Created ${TEST_CONFIG.scenesPerChapter} scenes`);
      }
    }

    // Verify test data
    const testStories = await verifyTestData(auth);

    console.log('\n✅ Database setup complete!\n');
    console.log('Next steps:');
    console.log('  1. Run cache performance test: node scripts/cache-test-measure.mjs');
    console.log('  2. Update test data: node scripts/cache-test-update.mjs');
    console.log('  3. Run E2E test: npx playwright test tests/cache-performance.spec.ts\n');

    // Export test story IDs
    console.log('Test Story IDs:', testStories.map(s => s.id));

  } catch (error) {
    console.error('\n❌ Error during setup:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

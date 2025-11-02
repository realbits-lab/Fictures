#!/usr/bin/env node

/**
 * Cache Performance Test - Database Setup
 *
 * Creates mockup test data for validating caching and optimization:
 * - Test stories with chapters and scenes
 * - Performance measurement baseline
 * - Cache invalidation testing
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, like } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema.ts';

// Load environment variables
config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql, { schema });

// Test configuration
const TEST_CONFIG = {
  storyCount: 3,
  chaptersPerStory: 5,
  scenesPerChapter: 3,
  testUserId: 'test-cache-user',
  testUserEmail: 'cache-test@fictures.xyz',
};

async function createTestUser() {
  console.log('\n📝 Creating test user...');

  // Check if test user exists
  const existingUser = await db.query.users.findFirst({
    where: eq(schema.users.email, TEST_CONFIG.testUserEmail),
  });

  if (existingUser) {
    console.log(`✅ Test user exists: ${existingUser.id}`);
    return existingUser.id;
  }

  // Create new test user
  const [user] = await db
    .insert(schema.users)
    .values({
      email: TEST_CONFIG.testUserEmail,
      name: 'Cache Test User',
      role: 'writer',
    })
    .returning();

  console.log(`✅ Created test user: ${user.id}`);
  return user.id;
}

async function createMockupStories(userId) {
  console.log(`\n📚 Creating ${TEST_CONFIG.storyCount} test stories...`);

  const stories = [];

  for (let i = 1; i <= TEST_CONFIG.storyCount; i++) {
    const [story] = await db
      .insert(schema.stories)
      .values({
        title: `Cache Test Story ${i}`,
        genre: 'fantasy',
        status: i === 1 ? 'published' : 'writing',
        authorId: userId,
        summary: `This is a test story for cache performance testing. Story ${i} with chapters and scenes.`,
        tone: 'aspirational',
        moralFramework: {
          centralVirtue: 'courage',
          testedVirtues: ['honesty', 'perseverance'],
          consequencePattern: 'redemption',
        },
        viewCount: i * 100,
        imageUrl: `http://localhost:3000/api/placeholder?width=1792&height=1024&text=Story+${i}`,
      })
      .returning();

    console.log(`  ✅ Story ${i}: ${story.id} (${story.status})`);
    stories.push(story);

    // Create chapters for this story
    await createMockupChapters(story.id, userId, i);
  }

  return stories;
}

async function createMockupChapters(storyId, userId, storyIndex) {
  console.log(`    📖 Creating ${TEST_CONFIG.chaptersPerStory} chapters...`);

  for (let i = 1; i <= TEST_CONFIG.chaptersPerStory; i++) {
    const [chapter] = await db
      .insert(schema.chapters)
      .values({
        title: `Chapter ${i}: Testing Cache Layer ${i}`,
        summary: `This chapter tests caching behavior at layer ${i}. It contains scenes with various content.`,
        storyId: storyId,
        authorId: userId,
        orderIndex: i,
        status: i <= 3 ? 'published' : 'writing',
        arcPosition: i / TEST_CONFIG.chaptersPerStory,
        adversityType: 'external',
        virtueType: 'courage',
      })
      .returning();

    console.log(`      ✅ Chapter ${i}: ${chapter.id}`);

    // Create scenes for this chapter
    await createMockupScenes(chapter.id, userId, storyIndex, i);
  }
}

async function createMockupScenes(chapterId, userId, storyIndex, chapterIndex) {
  console.log(`        🎬 Creating ${TEST_CONFIG.scenesPerChapter} scenes...`);

  for (let i = 1; i <= TEST_CONFIG.scenesPerChapter; i++) {
    const sceneNumber = (chapterIndex - 1) * TEST_CONFIG.scenesPerChapter + i;

    const content = `This is scene ${sceneNumber} for cache testing.\n\n` +
      `It contains multiple paragraphs to simulate real content.\n\n` +
      `The scene is designed to test caching behavior across three layers:\n` +
      `1. SWR Memory Cache (30 minutes)\n` +
      `2. localStorage Cache (1 hour)\n` +
      `3. Redis Cache (10 minutes for public)\n\n` +
      `Each layer should be tested for cold and warm loads.\n\n` +
      `Scene ${sceneNumber} - Chapter ${chapterIndex} - Story ${storyIndex}`;

    await db.insert(schema.scenes).values({
      title: `Scene ${sceneNumber}: Cache Test`,
      content: content,
      chapterId: chapterId,
      authorId: userId,
      orderIndex: i,
      status: 'published',
      visibility: i === 1 ? 'public' : 'unlisted',
      cyclePhase: 'adversity',
      emotionalBeat: 'tension',
      wordCount: content.split(/\s+/).length,
      viewCount: sceneNumber * 10,
      imageUrl: `http://localhost:3000/api/placeholder?width=1344&height=768&text=Scene+${sceneNumber}`,
    });
  }

  console.log(`        ✅ Created ${TEST_CONFIG.scenesPerChapter} scenes`);
}

async function clearPreviousTestData() {
  console.log('\n🗑️  Clearing previous test data...');

  try {
    // Find test user
    const testUser = await db.query.users.findFirst({
      where: eq(schema.users.email, TEST_CONFIG.testUserEmail),
    });

    if (!testUser) {
      console.log('✅ No previous test data found');
      return;
    }

    // Get all test stories
    const testStories = await db.query.stories.findMany({
      where: eq(schema.stories.authorId, testUser.id),
    });

    if (testStories.length === 0) {
      console.log('✅ No test stories to delete');
      return;
    }

    console.log(`  Found ${testStories.length} test stories to delete`);

    // Delete scenes, chapters, and stories (cascade should handle this, but being explicit)
    for (const story of testStories) {
      // Delete scenes
      const chapters = await db.query.chapters.findMany({
        where: eq(schema.chapters.storyId, story.id),
      });

      for (const chapter of chapters) {
        await db.delete(schema.scenes).where(eq(schema.scenes.chapterId, chapter.id));
      }

      // Delete chapters
      await db.delete(schema.chapters).where(eq(schema.chapters.storyId, story.id));

      // Delete story
      await db.delete(schema.stories).where(eq(schema.stories.id, story.id));
    }

    console.log(`✅ Deleted ${testStories.length} test stories and related data`);
  } catch (error) {
    console.error('❌ Error clearing test data:', error.message);
  }
}

async function verifyTestData() {
  console.log('\n✅ Verifying test data...');

  const testUser = await db.query.users.findFirst({
    where: eq(schema.users.email, TEST_CONFIG.testUserEmail),
  });

  const stories = await db.query.stories.findMany({
    where: eq(schema.stories.authorId, testUser.id),
  });

  let totalChapters = 0;
  let totalScenes = 0;

  for (const story of stories) {
    const chapters = await db.query.chapters.findMany({
      where: eq(schema.chapters.storyId, story.id),
    });
    totalChapters += chapters.length;

    for (const chapter of chapters) {
      const scenes = await db.query.scenes.findMany({
        where: eq(schema.scenes.chapterId, chapter.id),
      });
      totalScenes += scenes.length;
    }
  }

  console.log(`
📊 Test Data Summary:
  - Stories: ${stories.length}
  - Chapters: ${totalChapters}
  - Scenes: ${totalScenes}
  - Expected Chapters: ${TEST_CONFIG.storyCount * TEST_CONFIG.chaptersPerStory}
  - Expected Scenes: ${TEST_CONFIG.storyCount * TEST_CONFIG.chaptersPerStory * TEST_CONFIG.scenesPerChapter}
  `);

  return {
    userId: testUser.id,
    stories,
    totalChapters,
    totalScenes,
  };
}

async function main() {
  console.log('🚀 Cache Performance Test - Database Setup\n');
  console.log('Configuration:');
  console.log(`  - Stories: ${TEST_CONFIG.storyCount}`);
  console.log(`  - Chapters per story: ${TEST_CONFIG.chaptersPerStory}`);
  console.log(`  - Scenes per chapter: ${TEST_CONFIG.scenesPerChapter}`);
  console.log(`  - Total scenes: ${TEST_CONFIG.storyCount * TEST_CONFIG.chaptersPerStory * TEST_CONFIG.scenesPerChapter}`);

  try {
    // Clear previous test data
    await clearPreviousTestData();

    // Create test user
    const userId = await createTestUser();

    // Create mockup stories with chapters and scenes
    await createMockupStories(userId);

    // Verify test data
    const summary = await verifyTestData();

    console.log('\n✅ Database setup complete!\n');
    console.log('Next steps:');
    console.log('  1. Run cache performance test: node scripts/cache-test-measure.mjs');
    console.log('  2. Update test data: node scripts/cache-test-update.mjs');
    console.log('  3. Run E2E test: npx playwright test tests/cache-performance.spec.ts\n');

    // Export test story IDs for use in other scripts
    const testStoryIds = summary.stories.map(s => s.id);
    console.log('Test Story IDs:', testStoryIds);

  } catch (error) {
    console.error('\n❌ Error during setup:', error);
    process.exit(1);
  }
}

main();

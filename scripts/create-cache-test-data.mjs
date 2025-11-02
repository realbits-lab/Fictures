#!/usr/bin/env node

/**
 * Create Cache Test Data
 * Generates 3 test stories with 5 chapters each and 3 scenes per chapter
 * Total: 3 stories, 15 chapters, 45 scenes
 */

import postgres from 'postgres';
import fs from 'fs';
import { customAlphabet } from 'nanoid';

// Read auth data
const authData = JSON.parse(fs.readFileSync('.auth/user.json', 'utf-8'));
const userId = authData.userId;

const client = postgres(process.env.POSTGRES_URL);

// Use nanoid for consistent IDs
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-', 21);

async function createCacheTestData() {
  try {
    console.log('\n🚀 Creating Cache Test Data\n');
    console.log(`User ID: ${userId}\n`);

    // Clear old test data
    console.log('🗑️  Clearing old cache test stories...');
    const oldStories = await client`
      SELECT id, title FROM stories
      WHERE author_id = ${userId}
      AND title LIKE 'Cache Test Story%'
    `;

    for (const story of oldStories) {
      // Get chapters for this story
      const chapters = await client`
        SELECT id FROM chapters WHERE story_id = ${story.id}
      `;

      // Delete scenes for each chapter
      for (const chapter of chapters) {
        await client`DELETE FROM scenes WHERE chapter_id = ${chapter.id}`;
      }

      // Delete chapters
      await client`DELETE FROM chapters WHERE story_id = ${story.id}`;

      // Finally delete the story
      await client`DELETE FROM stories WHERE id = ${story.id}`;
    }
    console.log(`✅ Cleared ${oldStories.length} old test stories\n`);

    // Create 3 test stories
    console.log('📚 Creating 3 cache test stories...\n');

    const createdStories = [];

    for (let i = 1; i <= 3; i++) {
      const storyId = nanoid();
      const storyTitle = `Cache Test Story ${i}`;
      const storyStatus = i === 1 ? 'published' : 'writing';

      console.log(`Story ${i}: Creating "${storyTitle}" (${storyStatus})...`);

      // Create story
      await client`
        INSERT INTO stories (
          id, title, summary, genre, status, tone,
          author_id, view_count, image_url,
          created_at, updated_at
        ) VALUES (
          ${storyId},
          ${storyTitle},
          ${'Test story ' + i + ' for cache performance testing with chapters and scenes.'},
          'Fantasy',
          ${storyStatus},
          'hopeful',
          ${userId},
          ${i * 100},
          ${'https://placehold.co/1792x1024?text=Story+' + i},
          NOW(),
          NOW()
        )
      `;

      console.log(`  ✅ Story: ${storyId}`);

      // Create 5 chapters per story
      for (let j = 1; j <= 5; j++) {
        const chapterId = nanoid();
        const chapterTitle = `Chapter ${j}: Testing Cache Layer ${j}`;
        const chapterStatus = j <= 3 ? 'published' : 'writing';

        await client`
          INSERT INTO chapters (
            id, title, summary, story_id, author_id,
            order_index, status, created_at, updated_at
          ) VALUES (
            ${chapterId},
            ${chapterTitle},
            ${'Chapter ' + j + ' tests caching behavior with multiple scenes.'},
            ${storyId},
            ${userId},
            ${j},
            ${chapterStatus},
            NOW(),
            NOW()
          )
        `;

        // Create 3 scenes per chapter
        for (let k = 1; k <= 3; k++) {
          const sceneId = nanoid();
          const sceneNum = (j - 1) * 3 + k;
          const sceneTitle = `Scene ${sceneNum}: Cache Test`;
          const content = `Scene ${sceneNum} for cache testing.

Multiple paragraphs to test caching:
- SWR Memory (30 min)
- localStorage (1 hour)
- Redis (10 min)

Scene ${sceneNum} - Chapter ${j} - Story ${i}

This content is used for performance benchmarking of the three-layer cache system.`;

          const visibility = k === 1 ? 'public' : 'unlisted';

          await client`
            INSERT INTO scenes (
              id, title, content, chapter_id,
              order_index, visibility,
              created_at, updated_at
            ) VALUES (
              ${sceneId},
              ${sceneTitle},
              ${content},
              ${chapterId},
              ${k},
              ${visibility},
              NOW(),
              NOW()
            )
          `;
        }

        console.log(`    Chapter ${j}: ${chapterId} (${chapterStatus}, 3 scenes)`);
      }

      createdStories.push({ id: storyId, title: storyTitle, status: storyStatus });
      console.log('');
    }

    // Verify data
    console.log('✅ Data creation complete!\n');
    console.log('📊 Summary:');

    const stories = await client`
      SELECT id, title, status FROM stories
      WHERE author_id = ${userId}
      AND title LIKE 'Cache Test Story%'
    `;

    const chapters = await client`
      SELECT c.id FROM chapters c
      INNER JOIN stories s ON s.id = c.story_id
      WHERE s.author_id = ${userId}
      AND s.title LIKE 'Cache Test Story%'
    `;

    const scenes = await client`
      SELECT sc.id FROM scenes sc
      INNER JOIN chapters c ON c.id = sc.chapter_id
      INNER JOIN stories s ON s.id = c.story_id
      WHERE s.author_id = ${userId}
      AND s.title LIKE 'Cache Test Story%'
    `;

    console.log(`  Stories: ${stories.length}`);
    console.log(`  Chapters: ${chapters.length}`);
    console.log(`  Scenes: ${scenes.length}\n`);

    console.log('📋 Story Details:');
    for (const story of stories) {
      console.log(`  ${story.id} - ${story.title} (${story.status})`);
    }

    console.log('\n🎉 Cache test data ready for testing!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createCacheTestData();

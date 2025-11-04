#!/usr/bin/env node

/**
 * Create a test story for testing purposes
 */

import postgres from 'postgres';
import fs from 'fs';
import { randomUUID } from 'crypto';

const authData = JSON.parse(fs.readFileSync('.auth/user.json', 'utf-8'));
const writerUserId = authData.profiles.writer.userId;

const client = postgres(process.env.DATABASE_URL);

async function createTestStory() {
  try {
    console.log('Creating test story for writer account...');
    console.log('Writer ID:', writerUserId);

    // Check if story already exists
    const existing = await client`
      SELECT id, title FROM stories
      WHERE author_id = ${writerUserId}
      LIMIT 1
    `;

    if (existing.length > 0) {
      console.log('✅ Test story already exists:', existing[0].id, existing[0].title);
      await client.end();
      return;
    }

    const storyId = randomUUID();
    const partId = randomUUID();
    const chapterId = randomUUID();

    // Create a simple test story
    await client`
      INSERT INTO stories (id, title, summary, genre, status, author_id, is_public, created_at, updated_at)
      VALUES (
        ${storyId},
        'Test Story for Resizable Panels',
        'A test story created to verify the resizable panel functionality in the story editor.',
        'Testing',
        'in_progress',
        ${writerUserId},
        false,
        NOW(),
        NOW()
      )
    `;

    console.log('✅ Created test story:', storyId);

    // Create a test part
    await client`
      INSERT INTO parts (id, story_id, title, order_index, created_at, updated_at)
      VALUES (
        ${partId},
        ${storyId},
        'Part 1',
        1,
        NOW(),
        NOW()
      )
    `;

    console.log('✅ Created test part:', partId);

    // Create a test chapter
    await client`
      INSERT INTO chapters (id, story_id, part_id, title, order_index, status, created_at, updated_at)
      VALUES (
        ${chapterId},
        ${storyId},
        ${partId},
        'Chapter 1: The Beginning',
        1,
        'completed',
        NOW(),
        NOW()
      )
    `;

    console.log('✅ Created test chapter:', chapterId);

    // Create some test scenes
    for (let i = 1; i <= 3; i++) {
      const sceneId = randomUUID();
      await client`
        INSERT INTO scenes (id, story_id, part_id, chapter_id, title, content, order_index, status, created_at, updated_at)
        VALUES (
          ${sceneId},
          ${storyId},
          ${partId},
          ${chapterId},
          ${'Scene ' + i},
          ${'This is test scene ' + i + '. It contains some test content to verify the editor layout and scrolling functionality.'},
          ${i},
          'completed',
          NOW(),
          NOW()
        )
      `;

      console.log(`✅ Created test scene ${i}:`, sceneId);
    }

    console.log('\n✅ Test story created successfully!');
    console.log('Story ID:', storyId);
    console.log('You can now navigate to: /studio/edit/story/' + storyId);

  } catch (error) {
    console.error('❌ Error creating test story:', error);
    throw error;
  } finally {
    await client.end();
  }
}

createTestStory();

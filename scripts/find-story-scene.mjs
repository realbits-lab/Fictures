#!/usr/bin/env node

/**
 * Find story and scene IDs for comic generation
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/find-story-scene.mjs
 */

import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL, {
  ssl: 'require',
  max: 1,
});

async function findStoryAndScene() {
  console.log('🔍 Searching for "The Artificer\'s Canvas" story...\n');

  try {
    // Find the story
    const stories = await sql`
      SELECT id, title, genre, author_id, created_at
      FROM stories
      WHERE title ILIKE '%Artificer%'
      LIMIT 5
    `;

    if (stories.length === 0) {
      console.log('❌ No stories found matching "Artificer"');
      return;
    }

    console.log(`Found ${stories.length} story(ies):\n`);
    stories.forEach((story, i) => {
      console.log(`${i + 1}. "${story.title}"`);
      console.log(`   ID: ${story.id}`);
      console.log(`   Genre: ${story.genre}`);
      console.log(`   Author: ${story.author_id}`);
      console.log('');
    });

    // Find scenes for the first matching story
    const storyId = stories[0].id;
    console.log(`\n📄 Fetching scenes for "${stories[0].title}"...\n`);

    const scenes = await sql`
      SELECT s.id, s.title, s.order_index, s.content, s.comic_status, s.comic_panel_count,
             c.id as chapter_id, c.title as chapter_title, c.order_index as chapter_order
      FROM scenes s
      JOIN chapters c ON s.chapter_id = c.id
      WHERE c.story_id = ${storyId}
      ORDER BY c.order_index, s.order_index
    `;

    if (scenes.length === 0) {
      console.log('❌ No scenes found for this story');
      return;
    }

    console.log(`Found ${scenes.length} scene(s):\n`);

    let targetScene = null;
    scenes.forEach((scene, i) => {
      const hasComic = scene.comic_status ? `✓ Comic (${scene.comic_panel_count} panels)` : '✗ No comic';
      console.log(`${i + 1}. "${scene.title}" [${hasComic}]`);
      console.log(`   Scene ID: ${scene.id}`);
      console.log(`   Chapter: "${scene.chapter_title}" (${scene.chapter_id})`);
      console.log(`   Order: Ch${scene.chapter_order}.${scene.order_index}`);
      console.log(`   Content length: ${scene.content ? scene.content.length : 0} chars`);

      if (scene.title.toLowerCase().includes('echoes') || scene.title.toLowerCase().includes('unprogrammed')) {
        targetScene = scene;
        console.log(`   ⭐ TARGET SCENE FOUND!`);
      }
      console.log('');
    });

    if (targetScene) {
      console.log('\n✅ Target Scene Details:\n');
      console.log(`Story ID: ${storyId}`);
      console.log(`Scene ID: ${targetScene.id}`);
      console.log(`Title: "${targetScene.title}"`);
      console.log(`Comic Status: ${targetScene.comic_status || 'not generated'}`);
      console.log(`Panel Count: ${targetScene.comic_panel_count || 0}`);
      console.log('');
      console.log('Use this Scene ID for comic generation:');
      console.log(`  ${targetScene.id}`);
    } else {
      console.log('\n⚠️  Scene "Echoes of Unprogrammed Data" not found');
      console.log('Available scenes listed above');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

findStoryAndScene().catch(console.error);

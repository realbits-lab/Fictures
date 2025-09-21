import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql as sqlQuery } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const sql = postgres(process.env.POSTGRES_URL);
const db = drizzle(sql);

async function checkScenes() {
  try {
    // Try specific story ID first (from our recent generation)
    let storyId = 'o3U938eUZzC6ix1otydmd';
    let storyTitle = 'Echoes of Self';

    // Check if this story exists
    const story = await db.execute(sqlQuery`
      SELECT id, title FROM stories
      WHERE id = ${storyId}
    `);

    if (story.rows.length === 0) {
      console.log('Story not found, checking for most recent story...');
      // Get the most recent story
      const recentStory = await db.execute(sqlQuery`
        SELECT id, title FROM stories
        ORDER BY created_at DESC
        LIMIT 1
      `);

      if (recentStory.rows.length === 0) {
        console.log('No stories found in database');
        return;
      }

      storyId = recentStory.rows[0].id;
      storyTitle = recentStory.rows[0].title;
    } else {
      storyTitle = story.rows[0].title;
    }

    console.log(`Checking story: "${storyTitle}" (ID: ${storyId})`);

    // Get scenes for this story
    const scenes = await db.execute(sqlQuery`
      SELECT id, title, content, word_count, created_at, updated_at, scene_number
      FROM scenes
      WHERE story_id = ${storyId}
      ORDER BY scene_number
    `);

    console.log(`\nFound ${scenes.rows.length} scenes:`);

    if (scenes.rows.length === 0) {
      console.log('No scenes found for this story.');

      // Let's check if there are any scenes at all
      const allScenes = await db.execute(sqlQuery`
        SELECT id, title, story_id, scene_number
        FROM scenes
        ORDER BY created_at DESC
        LIMIT 5
      `);

      console.log(`\nTotal scenes in database: ${allScenes.rows.length}`);
      allScenes.rows.forEach((scene) => {
        console.log(`  - ${scene.title} (Story: ${scene.story_id}, Scene #${scene.scene_number})`);
      });
    } else {
      scenes.rows.forEach((scene, index) => {
        console.log(`\nScene ${scene.scene_number || index + 1}: ${scene.title}`);
        console.log(`  ID: ${scene.id}`);
        console.log(`  Content: ${scene.content ? scene.content.substring(0, 200) + '...' : 'NULL or EMPTY'}`);
        console.log(`  Word Count: ${scene.word_count || 0}`);
        console.log(`  Created: ${scene.created_at}`);
        console.log(`  Updated: ${scene.updated_at}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkScenes();
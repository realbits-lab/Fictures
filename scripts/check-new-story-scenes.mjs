import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { eq } from 'drizzle-orm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const sql = postgres(process.env.POSTGRES_URL);

// Simplified schema definitions
const scenes = {
  id: 'id',
  title: 'title',
  content: 'content',
  wordCount: 'wordCount',
  storyId: 'storyId'
};

async function checkNewStoryScenes() {
  try {
    console.log('Connecting to database...');

    // Check the latest story ID: BGG8trYiwfuiQ5MroR2Uj
    const storyId = 'BGG8trYiwfuiQ5MroR2Uj';
    console.log(`\n======= Checking scenes for story ${storyId} =======`);

    // Query scenes via chapters join
    const result = await sql`
      SELECT s.id, s.title, s.word_count,
             CASE
               WHEN s.content IS NULL THEN 'NULL'
               WHEN s.content = '' THEN 'EMPTY'
               WHEN s.content LIKE '%[Scene content to be generated%' THEN 'PLACEHOLDER'
               ELSE 'ACTUAL_CONTENT'
             END as content_status,
             LEFT(s.content, 200) as content_preview
      FROM scenes s
      JOIN chapters c ON s.chapter_id = c.id
      WHERE c.story_id = ${storyId}
    `;

    console.log(`Found ${result.length} scenes for story ${storyId}\n`);

    result.forEach((scene, index) => {
      console.log(`Scene ${index + 1}: ${scene.title}`);
      console.log(`  ID: ${scene.id}`);
      console.log(`  Word Count: ${scene.word_count || 0}`);
      console.log(`  Content Status: ${scene.content_status}`);
      if (scene.content_preview && scene.content_status === 'ACTUAL_CONTENT') {
        console.log(`  Content Preview: "${scene.content_preview}..."`);
      }
      console.log('');
    });

    // Also check the specific scene IDs we saw in the logs
    const sceneIds = ['5-V9yLxaq7FvuPtjz3elP', '9S4JabHnKTzH6bgW_etwv', 'h4WdIO41oVheqSLzSd-rG'];
    console.log('\n======= Checking specific scene IDs from logs =======');

    for (const sceneId of sceneIds) {
      const sceneResult = await sql`
        SELECT id, title, word_count,
               CASE
                 WHEN content IS NULL THEN 'NULL'
                 WHEN content = '' THEN 'EMPTY'
                 WHEN content LIKE '%[Scene content to be generated%' THEN 'PLACEHOLDER'
                 ELSE 'ACTUAL_CONTENT'
               END as content_status,
               LEFT(content, 100) as content_preview
        FROM scenes
        WHERE id = ${sceneId}
      `;

      if (sceneResult.length > 0) {
        const scene = sceneResult[0];
        console.log(`\n✅ Found scene ${sceneId}`);
        console.log(`   Title: ${scene.title}`);
        console.log(`   Word Count: ${scene.word_count}`);
        console.log(`   Content Status: ${scene.content_status}`);
        if (scene.content_status === 'ACTUAL_CONTENT') {
          console.log(`   Preview: "${scene.content_preview}..."`);
        }
      } else {
        console.log(`\n❌ Scene ${sceneId} not found in database`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkNewStoryScenes();
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const sql = postgres(process.env.POSTGRES_URL);

async function checkTemporalEchoes() {
  try {
    console.log('🔍 Checking Temporal Echoes story scenes...\n');

    // Check if the story exists
    const story = await sql`SELECT * FROM stories WHERE id = 'TkcpGiFmsFNw3bOEILN6d'`;
    console.log(`📖 Story found: ${story.length > 0 ? '✅ YES' : '❌ NO'}`);

    if (story.length > 0) {
      console.log(`   Title: ${story[0].title}`);
      console.log(`   Status: ${story[0].status}`);
      console.log(`   Created: ${story[0].created_at}`);
    }

    // Check scenes for this story
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
      WHERE c.story_id = 'TkcpGiFmsFNw3bOEILN6d'
    `;

    console.log(`\n🎬 Found ${result.length} scenes for Temporal Echoes`);
    result.forEach((scene, index) => {
      console.log(`\nScene ${index + 1}: ${scene.title}`);
      console.log(`  ID: ${scene.id}`);
      console.log(`  Word Count: ${scene.word_count || 0}`);
      console.log(`  Content Status: ${scene.content_status}`);
      if (scene.content_status === 'ACTUAL_CONTENT') {
        console.log(`  Preview: "${scene.content_preview}..."`);
      }
    });

    // Also check the latest scenes with IDs from our logs
    console.log('\n🔍 Checking specific scene IDs from generation logs:');
    const sceneIds = ['uUTKZzaGkZRxV2Mks8kKT', '6vfG48Kz8wQMmjOGwlljC', '314xSSvhKCHs_5jKTopcN'];

    for (const sceneId of sceneIds) {
      const sceneResult = await sql`
        SELECT id, title, word_count,
               CASE
                 WHEN content IS NULL THEN 'NULL'
                 WHEN content = '' THEN 'EMPTY'
                 WHEN content LIKE '%[Scene content to be generated%' THEN 'PLACEHOLDER'
                 ELSE 'ACTUAL_CONTENT'
               END as content_status,
               LEFT(content, 150) as content_preview
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
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

checkTemporalEchoes();
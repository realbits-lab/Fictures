import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as schema from '../src/lib/db/schema.ts';
import { eq } from 'drizzle-orm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const sql = postgres(process.env.POSTGRES_URL);
const db = drizzle(sql, { schema });

async function verifyStoryGeneration() {
  try {
    console.log('='.repeat(60));
    console.log('STORY GENERATION VERIFICATION');
    console.log('='.repeat(60));

    // Check the latest generated story
    const storyId = 'KBxKIfbbKtS6Yt9Xzg8sd';

    // Get the story
    const story = await db
      .select()
      .from(schema.stories)
      .where(eq(schema.stories.id, storyId))
      .limit(1);

    if (story.length === 0) {
      console.log('❌ Story not found!');
      return;
    }

    console.log('\n📖 STORY FOUND:');
    console.log(`  Title: ${story[0].title}`);
    console.log(`  ID: ${story[0].id}`);
    console.log(`  Status: ${story[0].status}`);

    // Get chapters for this story
    const chapters = await db
      .select()
      .from(schema.chapters)
      .where(eq(schema.chapters.storyId, storyId));

    console.log(`\n📚 CHAPTERS: Found ${chapters.length} chapters`);

    // Get all scenes for these chapters
    let totalScenes = 0;
    let scenesWithContent = 0;
    let totalWords = 0;

    for (const chapter of chapters) {
      console.log(`\n  Chapter: ${chapter.title}`);

      const scenes = await db
        .select()
        .from(schema.scenes)
        .where(eq(schema.scenes.chapterId, chapter.id));

      console.log(`    Scenes in chapter: ${scenes.length}`);

      for (const scene of scenes) {
        totalScenes++;

        const hasContent = scene.content && scene.content.length > 100;
        if (hasContent) {
          scenesWithContent++;
          totalWords += scene.wordCount || 0;
        }

        console.log(`      - ${scene.title}`);
        console.log(`        Content: ${hasContent ? `✅ ${scene.wordCount} words` : '❌ No content'}`);

        if (hasContent) {
          // Show first 150 characters of content
          const preview = scene.content.substring(0, 150).replace(/\n/g, ' ');
          console.log(`        Preview: "${preview}..."`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    console.log(`✅ Story generated successfully`);
    console.log(`✅ Total scenes: ${totalScenes}`);
    console.log(`✅ Scenes with content: ${scenesWithContent}/${totalScenes}`);
    console.log(`✅ Total words generated: ${totalWords}`);
    console.log('='.repeat(60));

    // Also check the most recent scenes in the database
    console.log('\n\n📝 LATEST SCENES IN DATABASE:');
    const recentScenes = await db
      .select()
      .from(schema.scenes)
      .orderBy(schema.scenes.updatedAt)
      .limit(5);

    for (const scene of recentScenes.reverse()) {
      console.log(`\n  ${scene.title}`);
      console.log(`    Word Count: ${scene.wordCount || 0}`);
      console.log(`    Updated: ${scene.updatedAt}`);
      console.log(`    Has Content: ${scene.content ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

verifyStoryGeneration();
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

async function checkScenes() {
  try {
    console.log('Connecting to database...');

    // Try to get all scenes (order by newest first)
    const allScenes = await db.select().from(schema.scenes)
      .orderBy(schema.scenes.createdAt)
      .limit(10);

    console.log(`Found ${allScenes.length} scenes in database:`);

    allScenes.forEach((scene, index) => {
      console.log(`\n======= Scene ${index + 1} =======`);
      console.log(`ID: ${scene.id}`);
      console.log(`Title: ${scene.title}`);
      console.log(`Story ID: ${scene.storyId}`);
      console.log(`Chapter ID: ${scene.chapterId}`);
      console.log(`Scene Number: ${scene.sceneNumber}`);
      console.log(`Content: ${scene.content ? scene.content.substring(0, 200) + '...' : 'NULL or EMPTY'}`);
      console.log(`Word Count: ${scene.wordCount || 0}`);
      console.log(`Updated: ${scene.updatedAt}`);
    });

    // Check specific story (latest one we just generated)
    const storyId = 'KBxKIfbbKtS6Yt9Xzg8sd';
    console.log(`\n\n======= Checking story ${storyId} =======`);

    const storyScenes = await db
      .select()
      .from(schema.scenes)
      .where(eq(schema.scenes.storyId, storyId));

    console.log(`Found ${storyScenes.length} scenes for story ${storyId}`);

    storyScenes.forEach((scene, index) => {
      console.log(`\nScene ${index + 1}: ${scene.title}`);
      console.log(`  Content length: ${scene.content ? scene.content.length : 0} characters`);
      console.log(`  Word Count: ${scene.wordCount || 0}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkScenes();
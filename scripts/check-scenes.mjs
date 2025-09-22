import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { scenes, chapters, stories } from '../src/lib/db/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const sql = postgres(process.env.POSTGRES_URL);
const db = drizzle(sql);

console.log('Checking scene and chapter relationships...\n');

// Get a story
const allStories = await db.select().from(stories).limit(1);
if (allStories.length === 0) {
  console.log('No stories found');
  process.exit(0);
}

const story = allStories[0];
console.log(`Story: ${story.title} (ID: ${story.id})`);
console.log(`Chapter IDs in story: ${story.chapterIds.length} chapters`);

// Get chapters for this story
const allChapters = await db.select().from(chapters)
  .where(eq(chapters.storyId, story.id))
  .limit(3);

console.log(`\nFound ${allChapters.length} chapters:`);
for (const chapter of allChapters) {
  console.log(`  - ${chapter.title} (ID: ${chapter.id})`);
  console.log(`    Scene IDs: ${chapter.sceneIds?.length || 0} scenes - [${(chapter.sceneIds || []).join(', ')}]`);
  console.log(`    Part ID: ${chapter.partId || 'none'}`);
}

// Get scenes
const allScenes = await db.select().from(scenes).limit(3);
console.log(`\nFound ${allScenes.length} scenes:`);
for (const scene of allScenes) {
  console.log(`  - ${scene.title} (ID: ${scene.id})`);
  console.log(`    Chapter ID: ${scene.chapterId || 'MISSING!'}`);
  console.log(`    Order Index: ${scene.orderIndex}`);
}

// Check if scenes have chapterId field populated
const scenesWithoutChapterId = await db.select().from(scenes)
  .where(eq(scenes.chapterId, null))
  .limit(5);

if (scenesWithoutChapterId.length > 0) {
  console.log(`\n⚠️  WARNING: Found ${scenesWithoutChapterId.length} scenes without chapterId!`);
  console.log('This is likely the issue - scenes need their chapterId field populated.');
}

// Check a specific chapter's scenes
if (allChapters.length > 0 && allChapters[0].sceneIds?.length > 0) {
  const firstChapter = allChapters[0];
  const firstSceneId = firstChapter.sceneIds[0];

  const [scene] = await db.select().from(scenes)
    .where(eq(scenes.id, firstSceneId))
    .limit(1);

  if (scene) {
    console.log(`\n✓ Scene ${scene.id} exists`);
    console.log(`  Chapter ID on scene: ${scene.chapterId || 'MISSING!'}`);
    console.log(`  Expected chapter ID: ${firstChapter.id}`);

    if (scene.chapterId !== firstChapter.id) {
      console.log('  ⚠️  MISMATCH: Scene chapterId does not match expected chapter!');
    }
  }
}

await sql.end();
process.exit(0);
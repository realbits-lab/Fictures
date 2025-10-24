import { db } from "../src/lib/db.js";
import { chapters, scenes } from "../src/lib/db/schema.js";
import { eq, inArray } from "drizzle-orm";

const storyId = 'uHsfe456SMlHj1QW7GqBl';

console.log('🔍 Checking story scenes for story:', storyId);

// Get all chapters for the story
const storyChapters = await db.select().from(chapters).where(eq(chapters.storyId, storyId));
console.log('\n📖 Chapters found:', storyChapters.length);
storyChapters.forEach(ch => {
  console.log(`  Chapter: ${ch.id}`);
  console.log(`    Title: ${ch.title}`);
  console.log(`    SceneIds: ${JSON.stringify(ch.sceneIds)}`);
});

// Get all scenes for these chapters
const chapterIds = storyChapters.map(ch => ch.id);
if (chapterIds.length > 0) {
  const storyScenes = await db.select().from(scenes).where(inArray(scenes.chapterId, chapterIds));
  console.log('\n🎬 Scenes found:', storyScenes.length);
  storyScenes.forEach(sc => {
    console.log(`  Scene: ${sc.id}`);
    console.log(`    Title: ${sc.title}`);
    console.log(`    ChapterId: ${sc.chapterId}`);
    console.log(`    Content length: ${sc.content?.length || 0} chars`);
  });

  // Check which chapters are missing scene IDs
  console.log('\n⚠️ Checking chapter-scene relationships:');
  storyChapters.forEach(ch => {
    const chapScenes = storyScenes.filter(sc => sc.chapterId === ch.id);
    const sceneIds = chapScenes.map(sc => sc.id);

    if (!ch.sceneIds || ch.sceneIds.length === 0) {
      console.log(`  ❌ Chapter ${ch.id} has empty sceneIds array`);
      if (chapScenes.length > 0) {
        console.log(`     But has ${chapScenes.length} scenes in database: ${sceneIds.join(', ')}`);
      }
    } else {
      console.log(`  ✅ Chapter ${ch.id} has ${ch.sceneIds.length} scene IDs stored`);
    }
  });
}

process.exit(0);
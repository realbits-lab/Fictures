import { db } from '../src/lib/db';
import { stories, parts, chapters, scenes } from '../src/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

async function checkLatestStory() {
  console.log('🔍 Checking latest story with nanoid IDs...\n');

  // Get the most recent story
  const latestStory = await db.select().from(stories)
    .orderBy(desc(stories.createdAt))
    .limit(1);

  if (latestStory.length === 0) {
    console.log('❌ No stories found in database');
    return;
  }

  const story = latestStory[0];
  console.log('📚 Latest Story:');
  console.log(`  Title: ${story.title}`);
  console.log(`  ID: ${story.id} (${story.id.length} chars)`);
  console.log(`  Status: ${story.status}`);
  console.log(`  Created: ${story.createdAt}`);

  // Get parts
  const storyParts = await db.select().from(parts)
    .where(eq(parts.storyId, story.id))
    .orderBy(parts.orderIndex);

  console.log(`\n📑 Parts (${storyParts.length}):`);
  storyParts.forEach(part => {
    console.log(`  Part ${part.orderIndex}: ${part.id} (${part.id.length} chars) - ${part.title}`);
  });

  // Get first 5 chapters
  const storyChapters = await db.select().from(chapters)
    .where(eq(chapters.storyId, story.id))
    .orderBy(chapters.orderIndex)
    .limit(5);

  console.log(`\n📖 Sample Chapters (first 5):`);
  storyChapters.forEach(chapter => {
    console.log(`  ${chapter.title}: ${chapter.id} (${chapter.id.length} chars)`);
  });

  // Get first 3 scenes
  if (storyChapters.length > 0) {
    const firstChapterId = storyChapters[0].id;
    const chapterScenes = await db.select().from(scenes)
      .where(eq(scenes.chapterId, firstChapterId))
      .orderBy(scenes.orderIndex)
      .limit(3);

    console.log(`\n🎬 Sample Scenes from first chapter:`);
    chapterScenes.forEach(scene => {
      console.log(`  ${scene.title}: ${scene.id} (${scene.id.length} chars)`);
    });
  }

  // Verify all IDs are using nanoid format (21 chars)
  console.log('\n✅ ID Format Verification:');
  const allIdsAreNanoid =
    story.id.length === 21 &&
    storyParts.every(p => p.id.length === 21) &&
    storyChapters.every(c => c.id.length === 21);

  if (allIdsAreNanoid) {
    console.log('  ✅ All IDs are using nanoid format (21 characters)');
    console.log('  ✅ No more custom IDs like "chap_part_001_01"');
  } else {
    console.log('  ❌ Some IDs are not using nanoid format');
  }

  console.log('\n🔗 Sample URLs:');
  if (storyChapters.length > 0) {
    console.log(`  Story: /stories/${story.id}`);
    console.log(`  Chapter: /write/${storyChapters[0].id}`);
  }
}

checkLatestStory()
  .catch(console.error)
  .finally(() => process.exit(0));
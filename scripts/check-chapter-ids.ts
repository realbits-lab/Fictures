import { db } from '../src/lib/db';
import { chapters } from '../src/lib/db/schema';

async function checkChapterIds() {
  console.log('Checking chapter IDs in database...');

  const chapterList = await db.select({
    id: chapters.id,
    title: chapters.title,
    storyId: chapters.storyId,
  }).from(chapters).limit(10);

  console.log('Sample chapter IDs:');
  chapterList.forEach(ch => {
    console.log(`ID: ${ch.id}, Title: ${ch.title}, Story: ${ch.storyId}`);
  });
}

checkChapterIds().catch(console.error).finally(() => process.exit(0));
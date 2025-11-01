import { db } from '../src/lib/db/index';
import { chapters, stories } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

const storyId = 'V-brkWWynVrT6vX_XE-JG';

async function checkStatus() {
  console.log('Checking story and chapter status...\n');

  // Check story
  const [story] = await db.select({
    id: stories.id,
    title: stories.title,
    status: stories.status,
    authorId: stories.authorId,
  }).from(stories).where(eq(stories.id, storyId));

  if (!story) {
    console.log('Story not found!');
    process.exit(1);
  }

  console.log('Story:');
  console.log('- Title:', story.title);
  console.log('- Status:', story.status);
  console.log('- AuthorID:', story.authorId);

  // Check chapters
  const chapterList = await db.select({
    id: chapters.id,
    title: chapters.title,
    status: chapters.status,
    orderIndex: chapters.orderIndex,
    partId: chapters.partId,
  }).from(chapters).where(eq(chapters.storyId, storyId));

  console.log('\nChapters:', chapterList.length);
  chapterList.forEach(ch => {
    console.log(`  - ${ch.title}: status="${ch.status}", order=${ch.orderIndex}, partId=${ch.partId}`);
  });

  process.exit(0);
}

checkStatus().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

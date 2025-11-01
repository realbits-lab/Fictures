import { db } from '../src/lib/db/index';
import { stories, parts, chapters } from '../src/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

const storyId = 'V-brkWWynVrT6vX_XE-JG';

async function checkStoryStructure() {
  console.log('Checking story structure in database...\n');

  // Get story
  const [story] = await db.select({
    id: stories.id,
    title: stories.title,
    imageUrl: stories.imageUrl,
    imageVariants: stories.imageVariants,
    status: stories.status,
    authorId: stories.authorId,
    userId: stories.userId,
  }).from(stories).where(eq(stories.id, storyId));

  if (!story) {
    console.log('❌ Story not found!');
    process.exit(1);
  }

  console.log('Story:', story.title);
  console.log('- imageVariants:', typeof story.imageVariants, story.imageVariants === null ? 'NULL' : 'has value');
  console.log('- authorId:', story.authorId);
  console.log('- userId:', story.userId);

  // Get parts
  const storyParts = await db.select({
    id: parts.id,
    title: parts.title,
    orderIndex: parts.orderIndex,
  }).from(parts).where(eq(parts.storyId, storyId)).orderBy(asc(parts.orderIndex));

  console.log('\nParts:', storyParts.length);

  // Get chapters
  const allChapters = await db.select({
    id: chapters.id,
    title: chapters.title,
    partId: chapters.partId,
    orderIndex: chapters.orderIndex,
    imageVariants: chapters.imageVariants,
  }).from(chapters).where(eq(chapters.storyId, storyId)).orderBy(asc(chapters.orderIndex));

  console.log('Chapters:', allChapters.length);

  // Check for NULL imageVariants
  const chaptersWithNullVariants = allChapters.filter(ch => ch.imageVariants === null);
  if (chaptersWithNullVariants.length > 0) {
    console.log('\n⚠️  Chapters with NULL imageVariants:', chaptersWithNullVariants.map(ch => ch.title));
  }

  console.log('\n✅ Database structure check complete');
  process.exit(0);
}

checkStoryStructure().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

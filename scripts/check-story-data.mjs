import { db } from '../src/lib/db/index.js';
import { stories } from '../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';

const storyId = 'V-brkWWynVrT6vX_XE-JG';

const [story] = await db.select({
  id: stories.id,
  title: stories.title,
  authorId: stories.authorId,
  userId: stories.userId,
  status: stories.status,
}).from(stories).where(eq(stories.id, storyId));

console.log('Story data from database:');
console.log('- id:', story?.id);
console.log('- title:', story?.title);
console.log('- authorId:', story?.authorId);
console.log('- userId:', story?.userId);
console.log('- status:', story?.status);

if (!story) {
  console.log('\n⚠️  Story NOT found in database!');
}

process.exit(0);

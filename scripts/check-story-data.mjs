import { db } from '../src/lib/db/index.js';
import { stories } from '../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';

const storyId = 'V-brkWWynVrT6vX_XE-JG';

const [story] = await db.select({
  id: stories.id,
  title: stories.title,
  imageUrl: stories.imageUrl,
  imageVariants: stories.imageVariants,
}).from(stories).where(eq(stories.id, storyId));

console.log('Story data from database:');
console.log('- id:', story?.id);
console.log('- title:', story?.title);
console.log('- imageUrl:', story?.imageUrl);
console.log('- imageVariants type:', typeof story?.imageVariants);
console.log('- imageVariants value:', story?.imageVariants);

if (story?.imageVariants === null) {
  console.log('\n⚠️  imageVariants is NULL in database!');
}

process.exit(0);

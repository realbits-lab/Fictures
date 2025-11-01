import { getStoryForReading } from '../src/lib/db/reading-queries.js';

const storyId = 'V-brkWWynVrT6vX_XE-JG';

console.log('Testing getStoryForReading...\n');
const story = await getStoryForReading(storyId);

if (!story) {
  console.log('Story not found!');
  process.exit(1);
}

console.log('Story data structure:');
console.log('- id:', story.id);
console.log('- title:', story.title);
console.log('- authorId:', story.authorId);
console.log('- userId:', story.userId);
console.log('- imageVariants:', typeof story.imageVariants);
console.log('- parts:', story.parts?.length || 0, 'parts');
console.log('- chapters:', story.chapters?.length || 0, 'chapters');

if (story.parts && story.parts.length > 0) {
  console.log('\nFirst part:', story.parts[0].title);
  console.log('  - chapters in part:', story.parts[0].chapters?.length || 0);
}

if (story.chapters && story.chapters.length > 0) {
  console.log('\nFirst chapter:', story.chapters[0]?.title || 'no title');
  console.log('  - scenes in chapter:', story.chapters[0]?.scenes);
}

console.log('\nFull story object keys:');
console.log(Object.keys(story));

console.log('\nimageVariants value:');
console.log(JSON.stringify(story.imageVariants, null, 2));

process.exit(0);

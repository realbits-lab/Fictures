import { db } from '../src/lib/db/index.ts';
import { stories } from '../src/lib/db/schema.ts';
import { like } from 'drizzle-orm';

const searchTitle = process.argv[2] || 'Secrets of the Obsidian Club';

try {
  const result = await db.select().from(stories).where(like(stories.title, `%${searchTitle}%`));

  if (result.length === 0) {
    console.log(`No stories found matching: ${searchTitle}`);
  } else {
    console.log(`Found ${result.length} story(ies):\n`);
    result.forEach(story => {
      console.log(`ID: ${story.id}`);
      console.log(`Title: ${story.title}`);
      console.log(`Created: ${story.createdAt}`);
      console.log(`Visibility: ${story.visibility}`);
      console.log('---');
    });
  }
} catch (error) {
  console.error('Error finding story:', error.message);
  process.exit(1);
}

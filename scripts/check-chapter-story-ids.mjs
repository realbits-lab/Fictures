import { db } from '../src/lib/db/index.js';
import { chapters, stories } from '../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  const story = await db.select().from(stories).where(eq(stories.id, 'vxnOZr0JK25rOH2DBTksz')).limit(1);
  console.log('Story:', story[0]?.title, 'ID:', story[0]?.id);

  const chaps = await db.select().from(chapters).where(eq(chapters.storyId, 'vxnOZr0JK25rOH2DBTksz')).limit(5);
  console.log('\nChapters with custom IDs:');
  chaps.forEach(c => {
    console.log(`  ID: ${c.id}`);
    console.log(`  Title: ${c.title}`);
    console.log(`  Created: ${c.createdAt}`);
    console.log('  ---');
  });

  // Check if there's a pattern
  console.log('\nAnalysis:');
  console.log('Story uses nanoid format:', story[0]?.id);
  console.log('Chapters use custom format: chap_part_XXX_YY');
  console.log('\nThis mismatch causes issues with routing!');
}

main().catch(console.error).finally(() => process.exit(0));
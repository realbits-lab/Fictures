import { db } from '../src/lib/db';
import { stories, chapters, parts } from '../src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

async function findChapterIdSource() {
  console.log('🔍 Investigating Chapter ID Format Issue\n');

  // Get the story with custom chapter IDs
  const storyId = 'vxnOZr0JK25rOH2DBTksz';

  const story = await db.select().from(stories).where(eq(stories.id, storyId)).limit(1);
  console.log('Story:', story[0]?.title);
  console.log('Story ID format: nanoid (21 chars):', story[0]?.id);
  console.log('Created:', story[0]?.createdAt);
  console.log('HNS Document:', story[0]?.hnsDocument ? 'Yes' : 'No');

  // Check if HNS document contains chapter IDs
  if (story[0]?.hnsDocument) {
    const hnsDoc = story[0].hnsDocument as any;
    if (hnsDoc.chapters) {
      console.log('\nHNS Document chapters structure:');
      Object.entries(hnsDoc.chapters).forEach(([partKey, partChapters]: [string, any]) => {
        console.log(`  Part ${partKey}:`);
        if (Array.isArray(partChapters)) {
          partChapters.forEach((ch: any) => {
            console.log(`    Chapter ${ch.chap}: ${ch.title}`);
            console.log(`      ID in HNS: ${ch.id || 'No ID field'}`);
          });
        }
      });
    }
  }

  console.log('\n📊 Database Chapter Records:');
  const chaps = await db.select({
    id: chapters.id,
    title: chapters.title,
    partId: chapters.partId,
    orderIndex: chapters.orderIndex
  })
  .from(chapters)
  .where(eq(chapters.storyId, storyId))
  .orderBy(chapters.orderIndex)
  .limit(5);

  chaps.forEach(ch => {
    console.log(`  ID: ${ch.id}`);
    console.log(`    Title: ${ch.title}`);
    console.log(`    Part: ${ch.partId}`);
    console.log(`    Order: ${ch.orderIndex}`);
  });

  console.log('\n🔑 Pattern Analysis:');
  console.log('  Chapter ID format: chap_part_XXX_YY');
  console.log('  Where XXX = part number (e.g., 001, 002, 003)');
  console.log('  Where YY = chapter number within part (e.g., 01, 02, 03)');

  console.log('\n❌ Problem:');
  console.log('  URLs use chapter ID: /write/chap_part_003_01');
  console.log('  But stories use nanoid: vxnOZr0JK25rOH2DBTksz');
  console.log('  This custom format was likely created by a script that pre-populated chapters');

  // Check when these chapters were created
  const oldestChapter = await db.select({
    id: chapters.id,
    createdAt: chapters.createdAt
  })
  .from(chapters)
  .where(eq(chapters.storyId, storyId))
  .orderBy(chapters.createdAt)
  .limit(1);

  console.log('\n⏰ Timeline:');
  console.log('  Story created:', story[0]?.createdAt);
  console.log('  First chapter created:', oldestChapter[0]?.createdAt);
  console.log('  Chapter ID:', oldestChapter[0]?.id);
}

findChapterIdSource().catch(console.error).finally(() => process.exit(0));
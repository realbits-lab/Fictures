#!/usr/bin/env node
/**
 * Check chapter partId values for a specific story
 * Verifies that chapters are correctly linked to parts via foreign key
 */

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);
const storyId = 'kfiNwbdYD2BAnC7IAyjps';

console.log(`\n🔍 Checking chapters for story: ${storyId}\n`);

try {
  // Get all chapters for this story
  const chapters = await sql`
    SELECT id, title, part_id, order_index, story_id
    FROM chapters
    WHERE story_id = ${storyId}
    ORDER BY order_index ASC
  `;

  console.log(`📊 Found ${chapters.length} total chapters\n`);

  chapters.forEach((chapter, index) => {
    console.log(`Chapter ${index + 1}:`);
    console.log(`  ID: ${chapter.id}`);
    console.log(`  Title: ${chapter.title}`);
    console.log(`  Part ID: ${chapter.part_id || '❌ NULL (not assigned to any part)'}`);
    console.log(`  Order Index: ${chapter.order_index}`);
    console.log('');
  });

  // Get parts for this story
  const parts = await sql`
    SELECT id, title, order_index
    FROM parts
    WHERE story_id = ${storyId}
    ORDER BY order_index ASC
  `;

  console.log(`📑 Found ${parts.length} total parts\n`);

  parts.forEach((part, index) => {
    console.log(`Part ${index + 1}:`);
    console.log(`  ID: ${part.id}`);
    console.log(`  Title: ${part.title}`);
    console.log(`  Order Index: ${part.order_index}`);
    console.log('');

    // Find chapters that belong to this part
    const partChapters = chapters.filter(c => c.part_id === part.id);
    console.log(`  Chapters in this part: ${partChapters.length}`);
    partChapters.forEach(ch => {
      console.log(`    - ${ch.title} (ID: ${ch.id})`);
    });
    console.log('');
  });

  // Find standalone chapters (no partId)
  const standaloneChapters = chapters.filter(c => !c.part_id);
  console.log(`📚 Standalone chapters (not in any part): ${standaloneChapters.length}\n`);
  standaloneChapters.forEach(ch => {
    console.log(`  - ${ch.title} (ID: ${ch.id})`);
  });

  console.log('\n✅ Analysis complete\n');

  // Get scenes to verify foreign key relationship works
  if (chapters.length > 0) {
    const chapterIds = chapters.map(c => c.id);
    const scenes = await sql`
      SELECT id, title, chapter_id, order_index
      FROM scenes
      WHERE chapter_id = ANY(${chapterIds})
      ORDER BY chapter_id, order_index ASC
    `;

    console.log(`🎬 Found ${scenes.length} total scenes across ${chapters.length} chapters\n`);

    chapters.forEach(chapter => {
      const chapterScenes = scenes.filter(s => s.chapter_id === chapter.id);
      if (chapterScenes.length > 0) {
        console.log(`Chapter "${chapter.title}" has ${chapterScenes.length} scene(s)`);
      }
    });
  }

  await sql.end();

} catch (error) {
  console.error('❌ Error:', error);
  await sql.end();
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Fix chapter part_id assignment
 * Links chapters to their corresponding parts based on story structure
 */

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);
const storyId = 'kfiNwbdYD2BAnC7IAyjps';
const partId = 'l7Zu3gG7S0mAhzMrWxG1h';
const chapterId = 'Cp9gCRKnPTPcff92chgO4';

console.log(`\n🔧 Fixing chapter-part relationship for story: ${storyId}\n`);

try {
  // Verify current state
  const [chapter] = await sql`
    SELECT id, title, part_id, story_id
    FROM chapters
    WHERE id = ${chapterId}
  `;

  console.log('📋 Current State:');
  console.log(`  Chapter: "${chapter.title}" (${chapter.id})`);
  console.log(`  Current part_id: ${chapter.part_id || 'NULL'}`);
  console.log('');

  const [part] = await sql`
    SELECT id, title
    FROM parts
    WHERE id = ${partId}
  `;

  console.log(`  Target Part: "${part.title}" (${part.id})`);
  console.log('');

  // Update chapter to link to part
  console.log('🔄 Updating chapter.part_id...');

  const updated = await sql`
    UPDATE chapters
    SET part_id = ${partId}, updated_at = NOW()
    WHERE id = ${chapterId}
    RETURNING id, title, part_id
  `;

  console.log('✅ Update successful!\n');
  console.log('📋 New State:');
  console.log(`  Chapter: "${updated[0].title}" (${updated[0].id})`);
  console.log(`  New part_id: ${updated[0].part_id}`);
  console.log('');

  // Verify the fix by fetching the story structure
  const chapters = await sql`
    SELECT id, title, part_id
    FROM chapters
    WHERE story_id = ${storyId}
  `;

  const parts = await sql`
    SELECT id, title
    FROM parts
    WHERE story_id = ${storyId}
  `;

  console.log('🔍 Verification:');
  parts.forEach(p => {
    const partChapters = chapters.filter(c => c.part_id === p.id);
    console.log(`  Part "${p.title}": ${partChapters.length} chapter(s)`);
    partChapters.forEach(ch => {
      console.log(`    - ${ch.title}`);
    });
  });

  const standaloneChapters = chapters.filter(c => !c.part_id);
  if (standaloneChapters.length > 0) {
    console.log(`  Standalone chapters: ${standaloneChapters.length}`);
    standaloneChapters.forEach(ch => {
      console.log(`    - ${ch.title}`);
    });
  }

  console.log('\n✅ Fix complete! Chapter is now correctly linked to part.\n');

  await sql.end();

} catch (error) {
  console.error('❌ Error:', error);
  await sql.end();
  process.exit(1);
}

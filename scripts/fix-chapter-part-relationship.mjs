#!/usr/bin/env node

/**
 * Fix Chapter-Part Relationship Script
 *
 * This script fixes chapters that should be nested under parts
 * but have a NULL part_id in the database.
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/fix-chapter-part-relationship.mjs
 */

import postgres from 'postgres';

// Read POSTGRES_URL from environment
const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ POSTGRES_URL environment variable not set');
  process.exit(1);
}

console.log('🔌 Connecting to database...');

// Create postgres client
const sql = postgres(connectionString, { max: 1 });

async function fixChapterPartRelationships() {
  console.log('🔧 Starting chapter-part relationship fix...\n');

  try {
    // Get all stories
    const allStories = await sql`
      SELECT id, title FROM stories
    `;
    console.log(`📚 Found ${allStories.length} stories to check\n`);

    let totalFixed = 0;

    for (const story of allStories) {
      console.log(`\n📖 Checking story: ${story.title} (${story.id})`);

      // Get all parts for this story
      const storyParts = await sql`
        SELECT id, title FROM parts WHERE story_id = ${story.id}
      `;

      // Get all chapters for this story
      const storyChapters = await sql`
        SELECT id, title, part_id FROM chapters WHERE story_id = ${story.id}
      `;

      const chaptersWithoutPart = storyChapters.filter(ch => ch.part_id === null);

      if (storyParts.length === 0 && chaptersWithoutPart.length === 0) {
        console.log('  ✓ No parts and no standalone chapters - skipping');
        continue;
      }

      if (storyParts.length === 0) {
        console.log(`  ✓ ${chaptersWithoutPart.length} standalone chapters (no parts exist) - this is valid`);
        continue;
      }

      if (chaptersWithoutPart.length === 0) {
        console.log(`  ✓ All ${storyChapters.length} chapters are already linked to parts`);
        continue;
      }

      // If we have both parts AND standalone chapters, we need to link them
      console.log(`  ⚠️  Found ${storyParts.length} part(s) and ${chaptersWithoutPart.length} orphaned chapter(s)`);

      // Strategy: Link all orphaned chapters to the first part
      // (You can modify this logic if needed - e.g., link based on orderIndex)
      const targetPart = storyParts[0];
      console.log(`  📌 Linking orphaned chapters to part: "${targetPart.title}" (${targetPart.id})`);

      for (const chapter of chaptersWithoutPart) {
        console.log(`    • Updating chapter: "${chapter.title}" (${chapter.id})`);

        await sql`
          UPDATE chapters SET part_id = ${targetPart.id} WHERE id = ${chapter.id}
        `;

        totalFixed++;
      }

      console.log(`  ✅ Fixed ${chaptersWithoutPart.length} chapter(s)`);
    }

    console.log(`\n✨ Done! Fixed ${totalFixed} chapter-part relationships total.`);

  } catch (error) {
    console.error('❌ Error fixing chapter-part relationships:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the fix
fixChapterPartRelationships()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

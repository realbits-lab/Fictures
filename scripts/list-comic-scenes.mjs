#!/usr/bin/env node

/**
 * List scenes with comic panels
 */

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
});

async function main() {
  try {
    const result = await sql`
      SELECT
        s.id,
        s.title,
        c.story_id,
        s.comic_status,
        s.comic_panel_count,
        s.comic_generated_at,
        st.title as story_title
      FROM scenes s
      LEFT JOIN chapters c ON s.chapter_id = c.id
      LEFT JOIN stories st ON c.story_id = st.id
      WHERE s.comic_generated_at IS NOT NULL
      ORDER BY s.comic_generated_at DESC
      LIMIT 20
    `;

    if (result.length === 0) {
      console.log('ℹ️  No scenes with comic panels found.');
      return;
    }

    console.log(`\nFound ${result.length} scene(s) with comic panels:\n`);

    result.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.title || 'Untitled'} (${row.comic_panel_count || 0} panels)`);
      console.log(`   Scene ID: ${row.id}`);
      console.log(`   Story: ${row.story_title}`);
      console.log(`   Status: ${row.comic_status}`);
      console.log(`   Generated: ${new Date(row.comic_generated_at).toLocaleString()}\n`);
    });

    console.log('To regenerate panels for a scene, run:');
    console.log(`   node scripts/regenerate-panels-via-api.mjs ${result[0].id}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();

#!/usr/bin/env node
/**
 * Check scene content from database to verify formatting
 */

import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL);

async function checkScene() {
  try {
    const scenes = await sql`
      SELECT
        s.id,
        s.title,
        LEFT(s.content, 500) as content_preview
      FROM scenes s
      JOIN chapters c ON s.chapter_id = c.id
      WHERE c.story_id = '3JpLdcXb5hQK7zy5g3QIj'
      ORDER BY s.order_index
      LIMIT 1
    `;

    console.log('First scene from database:');
    console.log('ID:', scenes[0].id);
    console.log('Title:', scenes[0].title);
    console.log('\nContent preview (first 500 chars):');
    console.log(scenes[0].content_preview);
    console.log('\n');
    console.log('Checking for dialogue separation:');

    // Check if there's a blank line before "Detective Ishikawa"
    const hasBlankLine = scenes[0].content_preview.includes('nod.\n\n"Detective');
    console.log('Has blank line before "Detective Ishikawa":', hasBlankLine);

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkScene();

#!/usr/bin/env node
/**
 * Debug script to test if UPDATE actually works
 */

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function testUpdate() {
  try {
    // Get one scene
    const scenes = await sql`
      SELECT
        s.id,
        s.title,
        s.content,
        LEFT(s.content, 200) as preview
      FROM scenes s
      JOIN chapters c ON s.chapter_id = c.id
      WHERE c.story_id = '3JpLdcXb5hQK7zy5g3QIj'
      ORDER BY s.order_index
      LIMIT 1
    `;

    if (scenes.length === 0) {
      console.log('No scenes found');
      await sql.end();
      return;
    }

    const scene = scenes[0];
    console.log('BEFORE UPDATE:');
    console.log('ID:', scene.id);
    console.log('Title:', scene.title);
    console.log('Preview:', scene.preview);
    console.log('');

    // Try a simple UPDATE
    const testContent = 'TEST UPDATE: ' + scene.content;

    console.log('Attempting UPDATE...');
    const updateResult = await sql`
      UPDATE scenes
      SET content = ${testContent}
      WHERE id = ${scene.id}
    `;

    console.log('UPDATE result:', updateResult);
    console.log('Update count:', updateResult.count);
    console.log('');

    // Fetch again to verify
    const afterUpdate = await sql`
      SELECT
        id,
        title,
        LEFT(content, 200) as preview
      FROM scenes
      WHERE id = ${scene.id}
    `;

    console.log('AFTER UPDATE:');
    console.log('Preview:', afterUpdate[0].preview);
    console.log('');
    console.log('Update successful?', afterUpdate[0].preview.startsWith('TEST UPDATE:'));

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

testUpdate();

#!/usr/bin/env node
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL);

async function find() {
  const scenes = await sql`
    SELECT s.id, s.title, LEFT(s.content, 150) as preview
    FROM scenes s
    JOIN chapters c ON s.chapter_id = c.id
    WHERE c.story_id = '3JpLdcXb5hQK7zy5g3QIj'
    AND s.content LIKE '%Detective Ishikawa%'
  `;

  console.log('Scenes with "Detective Ishikawa":', scenes.length);
  console.log('');

  for (const scene of scenes) {
    console.log('ID:', scene.id);
    console.log('Title:', scene.title);
    console.log('Preview:', scene.preview);
    console.log('');

    // Get full content and check around the dialogue
    const full = await sql`
      SELECT content FROM scenes WHERE id = ${scene.id}
    `;

    const content = full[0].content;
    const idx = content.indexOf('"Detective Ishikawa');
    if (idx > -1) {
      const before = content.substring(Math.max(0, idx - 150), idx);
      console.log('150 chars before dialogue:');
      console.log(JSON.stringify(before));
      console.log('');
      console.log('Has blank line (ends with .\\n\\n)?', before.endsWith('.\n\n'));
      console.log('');
    }
  }

  await sql.end();
}

find();

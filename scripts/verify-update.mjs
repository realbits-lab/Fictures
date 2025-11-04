#!/usr/bin/env node
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function verify() {
  const scene = await sql`
    SELECT id, title, LEFT(content, 100) as preview
    FROM scenes
    WHERE id = 's25ARzn_TttzuO9r5lvX3'
  `;

  console.log('Scene:', scene[0].title);
  console.log('Preview:', scene[0].preview);
  console.log('Has TEST UPDATE prefix?', scene[0].preview.startsWith('TEST UPDATE:'));

  await sql.end();
}

verify();

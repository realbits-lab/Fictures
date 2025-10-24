#!/usr/bin/env node

import { config } from 'dotenv';
import postgres from 'postgres';

// Load environment variables
config({ path: '.env.local' });

const sql = postgres(process.env.POSTGRES_URL);

(async () => {
  const stories = await sql`
    SELECT id, title, genre, status, author_id, created_at
    FROM stories
    ORDER BY created_at DESC
    LIMIT 5
  `;

  console.log('📚 Latest Stories in Database:');
  console.log('================================\n');

  if (stories.length === 0) {
    console.log('No stories found in database.');
  } else {
    stories.forEach((s, index) => {
      console.log(`Story #${index + 1}:`);
      console.log(`   ID: ${s.id}`);
      console.log(`   Title: ${s.title}`);
      console.log(`   Genre: ${s.genre}`);
      console.log(`   Status: ${s.status}`);
      console.log(`   Author: ${s.author_id}`);
      console.log(`   Created: ${new Date(s.created_at).toLocaleString()}`);
      console.log('');
    });

    console.log(`Total stories shown: ${stories.length}`);
  }

  await sql.end();
})();
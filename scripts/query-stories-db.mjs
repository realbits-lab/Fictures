#!/usr/bin/env node

/**
 * Query Stories from Database
 * Directly queries the database to list all stories
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

async function main() {
  const searchTerm = process.argv[2];

  try {
    console.log('🔍 Querying database for stories...\n');

    let query = 'SELECT id, title, genre, status, created_at FROM stories';
    let params = [];

    if (searchTerm) {
      query += ' WHERE title ILIKE $1';
      params.push(`%${searchTerm}%`);
    }

    query += ' ORDER BY created_at DESC';

    const stories = await sql.unsafe(query, params);

    if (stories.length === 0) {
      console.log(searchTerm ? `No stories found matching: ${searchTerm}` : 'No stories found.');
      return;
    }

    console.log(`Found ${stories.length} story(ies):\n`);

    stories.forEach((story, index) => {
      console.log(`${index + 1}. "${story.title}"`);
      console.log(`   ID: ${story.id}`);
      console.log(`   Genre: ${story.genre || 'N/A'}`);
      console.log(`   Status: ${story.status}`);
      console.log(`   Created: ${new Date(story.created_at).toLocaleDateString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();

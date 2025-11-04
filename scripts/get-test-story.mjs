#!/usr/bin/env node

/**
 * Get a published story ID for testing
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function getTestStory() {
  try {
    const result = await sql`
      SELECT id, title
      FROM stories
      WHERE status = 'published'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (result.length === 0) {
      console.error('No published stories found');
      process.exit(1);
    }

    console.log(result[0].id);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

getTestStory();

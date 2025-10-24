#!/usr/bin/env node

/**
 * Check if community tables exist in the database
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.POSTGRES_URL);

async function main() {
  console.log('Checking for community tables...\n');

  try {
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('community_posts', 'community_replies')
      ORDER BY table_name
    `;

    console.log('Found tables:', tables.map(t => t.table_name));

    if (tables.length === 0) {
      console.log('\n❌ No community tables found. They need to be created first.');
    } else {
      console.log('\n✓ Community tables exist');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

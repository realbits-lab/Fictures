#!/usr/bin/env node

/**
 * Deep cleanup: Delete ALL data from database tables directly
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const confirmed = args.includes('--confirm');

  console.log('\n' + '='.repeat(80));
  console.log('🗑️  DEEP DATABASE CLEANUP');
  console.log('='.repeat(80));

  const sql = postgres(connectionString);
  const db = drizzle(sql);

  console.log('\n📊 Checking database tables for data...\n');

  // Check all tables
  const tables = [
    'comic_panels',
    'ai_interactions',
    'community_posts',
    'community_likes',
    'community_dislikes',
    'community_replies',
    'bookmarks',
    'reading_sessions',
    'analytics_events',
    'analytics_insights',
    'scenes',
    'chapters',
    'parts',
    'characters',
    'settings',
    'stories'
  ];

  const counts = {};
  
  for (const table of tables) {
    try {
      const result = await sql`SELECT COUNT(*)::int as count FROM ${sql(table)}`;
      counts[table] = result[0].count;
      console.log(`   ${table.padEnd(25)} : ${result[0].count} rows`);
    } catch (error) {
      console.log(`   ${table.padEnd(25)} : ERROR (${error.message})`);
      counts[table] = 0;
    }
  }

  const totalRows = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`\n   ${'TOTAL'.padEnd(25)} : ${totalRows} rows\n`);

  if (totalRows === 0) {
    console.log('✅ Database is already clean!\n');
    await sql.end();
    return;
  }

  if (!confirmed) {
    console.log('⚠️  This will DELETE ALL DATA from the database!');
    console.log('   This action is IRREVERSIBLE.\n');
    console.log('   Run with --confirm to proceed:\n');
    console.log('   dotenv --file .env.local run node scripts/deep-cleanup-database.mjs --confirm\n');
    await sql.end();
    return;
  }

  console.log('🗑️  Starting deep cleanup (deleting in correct order)...\n');

  // Delete in reverse dependency order
  const deleteOrder = [
    'comic_panels',
    'ai_interactions',
    'community_replies',
    'community_likes',
    'community_dislikes',
    'community_posts',
    'bookmarks',
    'reading_sessions',
    'analytics_events',
    'analytics_insights',
    'scenes',
    'chapters',
    'parts',
    'characters',
    'settings',
    'stories'
  ];

  for (const table of deleteOrder) {
    if (counts[table] > 0) {
      try {
        console.log(`   Deleting from ${table}...`);
        await sql`DELETE FROM ${sql(table)}`;
        console.log(`   ✅ Deleted ${counts[table]} rows from ${table}`);
      } catch (error) {
        console.log(`   ❌ Failed to delete from ${table}: ${error.message}`);
      }
    }
  }

  console.log('\n✅ Database cleanup complete!');
  console.log('='.repeat(80));
  console.log('');

  await sql.end();
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});

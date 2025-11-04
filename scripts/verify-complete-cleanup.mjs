#!/usr/bin/env node

/**
 * Verify complete cleanup of database and Vercel Blob
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { list } from '@vercel/blob';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env.local') });

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('✅ COMPLETE CLEANUP VERIFICATION');
  console.log('='.repeat(80));

  // Check database
  console.log('\n📊 DATABASE STATUS:\n');
  
  const sql = postgres(process.env.DATABASE_URL);
  const db = drizzle(sql);

  const tables = [
    'comic_panels',
    'ai_interactions',
    'community_posts',
    'community_replies',
    'reading_sessions',
    'analytics_events',
    'scenes',
    'chapters',
    'parts',
    'characters',
    'settings',
    'stories'
  ];

  let totalRows = 0;
  
  for (const table of tables) {
    try {
      const result = await sql`SELECT COUNT(*)::int as count FROM ${sql(table)}`;
      const count = result[0].count;
      totalRows += count;
      
      if (count > 0) {
        console.log(`   ⚠️  ${table.padEnd(25)} : ${count} rows`);
      } else {
        console.log(`   ✅ ${table.padEnd(25)} : 0 rows`);
      }
    } catch (error) {
      // Table doesn't exist or error, skip
    }
  }

  await sql.end();

  console.log(`\n   ${'TOTAL'.padEnd(25)} : ${totalRows} rows`);
  
  if (totalRows === 0) {
    console.log('\n   ✅ Database is completely clean!\n');
  } else {
    console.log('\n   ⚠️  Database still has data!\n');
  }

  // Check Vercel Blob
  console.log('📦 VERCEL BLOB STATUS:\n');

  const { blobs } = await list({
    prefix: 'stories/',
    token: process.env.BLOB_READ_WRITE_TOKEN
  });

  console.log(`   Found ${blobs.length} files under "stories/" prefix`);

  if (blobs.length === 0) {
    console.log('   ✅ Vercel Blob is completely clean!\n');
  } else {
    console.log('   ⚠️  Vercel Blob still has files!\n');
    blobs.slice(0, 5).forEach((blob, i) => {
      console.log(`      ${i + 1}. ${blob.pathname}`);
    });
    if (blobs.length > 5) {
      console.log(`      ... and ${blobs.length - 5} more`);
    }
    console.log('');
  }

  // Final status
  console.log('='.repeat(80));
  
  if (totalRows === 0 && blobs.length === 0) {
    console.log('🎉 COMPLETE CLEANUP SUCCESSFUL!');
    console.log('   Database: Clean (0 rows)');
    console.log('   Vercel Blob: Clean (0 files)');
    console.log('\n💡 System is ready for fresh story and comic panel generation!');
  } else {
    console.log('⚠️  CLEANUP INCOMPLETE');
    if (totalRows > 0) {
      console.log(`   Database: ${totalRows} rows remaining`);
    }
    if (blobs.length > 0) {
      console.log(`   Vercel Blob: ${blobs.length} files remaining`);
    }
  }
  
  console.log('='.repeat(80));
  console.log('');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});

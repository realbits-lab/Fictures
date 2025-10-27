#!/usr/bin/env node

/**
 * Clean up all Vercel Blob files under stories/ prefix
 */

import { list, del } from '@vercel/blob';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env.local') });

async function main() {
  const args = process.argv.slice(2);
  const confirmed = args.includes('--confirm');

  console.log('\n' + '='.repeat(80));
  console.log('🗑️  VERCEL BLOB CLEANUP');
  console.log('='.repeat(80));

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('\n❌ BLOB_READ_WRITE_TOKEN not found in environment\n');
    process.exit(1);
  }

  console.log('\n📦 Listing Vercel Blob files under "stories/" prefix...\n');

  // List all blobs with stories/ prefix
  const { blobs } = await list({
    prefix: 'stories/',
    token: process.env.BLOB_READ_WRITE_TOKEN
  });

  console.log(`   Found ${blobs.length} files:\n`);

  if (blobs.length === 0) {
    console.log('✅ Vercel Blob is already clean!\n');
    return;
  }

  // Group by type
  const byType = {};
  blobs.forEach(blob => {
    const parts = blob.pathname.split('/');
    const type = parts[2] || 'other'; // stories/{storyId}/{type}/...
    if (!byType[type]) byType[type] = [];
    byType[type].push(blob);
  });

  Object.keys(byType).sort().forEach(type => {
    console.log(`   ${type.padEnd(20)} : ${byType[type].length} files`);
  });

  console.log(`\n   ${'TOTAL'.padEnd(20)} : ${blobs.length} files\n`);

  // Show first 10 files as sample
  console.log('   Sample files:');
  blobs.slice(0, 10).forEach((blob, i) => {
    const sizeKB = (blob.size / 1024).toFixed(1);
    console.log(`      ${i + 1}. ${blob.pathname} (${sizeKB} KB)`);
  });
  if (blobs.length > 10) {
    console.log(`      ... and ${blobs.length - 10} more\n`);
  }

  if (!confirmed) {
    console.log('\n⚠️  This will DELETE ALL FILES from Vercel Blob storage!');
    console.log('   This action is IRREVERSIBLE.\n');
    console.log('   Run with --confirm to proceed:\n');
    console.log('   dotenv --file .env.local run node scripts/cleanup-vercel-blob.mjs --confirm\n');
    return;
  }

  console.log('\n🗑️  Starting Vercel Blob cleanup...\n');

  // Delete in batches of 100
  const batchSize = 100;
  let deleted = 0;
  let failed = 0;

  for (let i = 0; i < blobs.length; i += batchSize) {
    const batch = blobs.slice(i, i + batchSize);
    const urls = batch.map(b => b.url);

    try {
      console.log(`   Deleting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(blobs.length / batchSize)} (${batch.length} files)...`);
      await del(urls, {
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      deleted += batch.length;
      console.log(`   ✅ Deleted ${batch.length} files`);
    } catch (error) {
      console.log(`   ❌ Failed to delete batch: ${error.message}`);
      failed += batch.length;
    }

    // Small delay between batches
    if (i + batchSize < blobs.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`✅ Deleted: ${deleted} files`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed} files`);
  }
  console.log('✅ Vercel Blob cleanup complete!');
  console.log('='.repeat(80));
  console.log('');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});

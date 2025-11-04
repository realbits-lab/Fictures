#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import { list, del } from '@vercel/blob';

const sql = neon(process.env.DATABASE_URL);

async function completeReset() {
  console.log('\n🔄 COMPLETE DATABASE AND BLOB RESET\n');
  console.log('='.repeat(80));
  console.log('\n⚠️  WARNING: This will delete ALL story data!\n');
  console.log('Tables to reset:');
  console.log('  - stories');
  console.log('  - parts');
  console.log('  - chapters');
  console.log('  - scenes');
  console.log('  - characters');
  console.log('  - settings');
  console.log('\nVercel Blob: ALL files with prefix "stories/"');
  console.log('\n' + '='.repeat(80));

  // Wait 3 seconds for confirmation
  console.log('\n⏳ Starting in 3 seconds... (Ctrl+C to cancel)');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // 1. Get counts before deletion
    console.log('\n📊 Current Data:');
    const storiesCount = await sql`SELECT COUNT(*) as count FROM stories`;
    const partsCount = await sql`SELECT COUNT(*) as count FROM parts`;
    const chaptersCount = await sql`SELECT COUNT(*) as count FROM chapters`;
    const scenesCount = await sql`SELECT COUNT(*) as count FROM scenes`;
    const charactersCount = await sql`SELECT COUNT(*) as count FROM characters`;
    const settingsCount = await sql`SELECT COUNT(*) as count FROM settings`;

    console.log(`  Stories:    ${storiesCount[0].count}`);
    console.log(`  Parts:      ${partsCount[0].count}`);
    console.log(`  Chapters:   ${chaptersCount[0].count}`);
    console.log(`  Scenes:     ${scenesCount[0].count}`);
    console.log(`  Characters: ${charactersCount[0].count}`);
    console.log(`  Settings:   ${settingsCount[0].count}`);

    // 2. Delete database tables (in reverse dependency order)
    console.log('\n🗑️  Deleting database records...');

    await sql`DELETE FROM scenes`;
    console.log('  ✓ Scenes deleted');

    await sql`DELETE FROM chapters`;
    console.log('  ✓ Chapters deleted');

    await sql`DELETE FROM parts`;
    console.log('  ✓ Parts deleted');

    await sql`DELETE FROM characters`;
    console.log('  ✓ Characters deleted');

    await sql`DELETE FROM settings`;
    console.log('  ✓ Settings deleted');

    await sql`DELETE FROM stories`;
    console.log('  ✓ Stories deleted');

    // 3. Delete Vercel Blob files
    console.log('\n🗑️  Deleting Vercel Blob files...');

    let blobCursor;
    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const listResult = await list({
        prefix: 'stories/',
        cursor: blobCursor,
        limit: 1000,
      });

      if (listResult.blobs.length === 0) {
        break;
      }

      // Delete in batches of 100
      const batchSize = 100;
      for (let i = 0; i < listResult.blobs.length; i += batchSize) {
        const batch = listResult.blobs.slice(i, i + batchSize);
        const urls = batch.map(blob => blob.url);

        if (urls.length > 0) {
          await del(urls);
          totalDeleted += urls.length;
          console.log(`  Deleted ${totalDeleted} blob files...`);
        }
      }

      blobCursor = listResult.cursor;
      hasMore = listResult.hasMore;
    }

    console.log(`  ✓ Total blob files deleted: ${totalDeleted}`);

    // 4. Verify deletion
    console.log('\n✅ Verification:');
    const finalStories = await sql`SELECT COUNT(*) as count FROM stories`;
    const finalParts = await sql`SELECT COUNT(*) as count FROM parts`;
    const finalChapters = await sql`SELECT COUNT(*) as count FROM chapters`;
    const finalScenes = await sql`SELECT COUNT(*) as count FROM scenes`;
    const finalCharacters = await sql`SELECT COUNT(*) as count FROM characters`;
    const finalSettings = await sql`SELECT COUNT(*) as count FROM settings`;

    console.log(`  Stories:    ${finalStories[0].count} (should be 0)`);
    console.log(`  Parts:      ${finalParts[0].count} (should be 0)`);
    console.log(`  Chapters:   ${finalChapters[0].count} (should be 0)`);
    console.log(`  Scenes:     ${finalScenes[0].count} (should be 0)`);
    console.log(`  Characters: ${finalCharacters[0].count} (should be 0)`);
    console.log(`  Settings:   ${finalSettings[0].count} (should be 0)`);

    const remainingBlobs = await list({ prefix: 'stories/', limit: 1 });
    console.log(`  Blob files: ${remainingBlobs.blobs.length} (should be 0)`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ RESET COMPLETE!');
    console.log('\n📊 Summary:');
    console.log(`  Database records deleted: ${parseInt(storiesCount[0].count) + parseInt(partsCount[0].count) + parseInt(chaptersCount[0].count) + parseInt(scenesCount[0].count) + parseInt(charactersCount[0].count) + parseInt(settingsCount[0].count)}`);
    console.log(`  Blob files deleted: ${totalDeleted}`);
    console.log('\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

completeReset().catch(console.error);

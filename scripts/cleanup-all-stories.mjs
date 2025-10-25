#!/usr/bin/env node

/**
 * Cleanup script to remove all stories and their associated images
 *
 * This script will:
 * 1. List all story-related images in Vercel Blob
 * 2. Delete all images from Vercel Blob
 * 3. Delete all stories from database (cascades to related tables)
 *
 * Usage: dotenv --file .env.local run node scripts/cleanup-all-stories.mjs
 *
 * CAUTION: This will permanently delete all stories and images!
 */

import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { list, del } from '@vercel/blob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const sql = postgres(process.env.POSTGRES_URL);

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

console.log('🧹 Story and Image Cleanup Script\n');
console.log('━'.repeat(80));
console.log('\n⚠️  WARNING: This will permanently delete ALL stories and images!\n');
console.log('━'.repeat(80));
console.log('\n');

try {
  // Step 1: Count database records
  console.log('📊 Step 1: Analyzing database...\n');

  const storiesCount = await sql`SELECT COUNT(*) as count FROM stories`;
  const scenesCount = await sql`SELECT COUNT(*) as count FROM scenes`;
  const chaptersCount = await sql`SELECT COUNT(*) as count FROM chapters`;
  const partsCount = await sql`SELECT COUNT(*) as count FROM parts`;
  const charactersCount = await sql`SELECT COUNT(*) as count FROM characters`;
  const settingsCount = await sql`SELECT COUNT(*) as count FROM settings`;
  const placesCount = await sql`SELECT COUNT(*) as count FROM places`;

  const totalStories = parseInt(storiesCount[0].count);
  const totalScenes = parseInt(scenesCount[0].count);
  const totalChapters = parseInt(chaptersCount[0].count);
  const totalParts = parseInt(partsCount[0].count);
  const totalCharacters = parseInt(charactersCount[0].count);
  const totalSettings = parseInt(settingsCount[0].count);
  const totalPlaces = parseInt(placesCount[0].count);

  console.log(`   Found ${totalStories} stories`);
  console.log(`   Found ${totalScenes} scenes`);
  console.log(`   Found ${totalChapters} chapters`);
  console.log(`   Found ${totalParts} parts`);
  console.log(`   Found ${totalCharacters} characters`);
  console.log(`   Found ${totalPlaces} places`);
  console.log(`   Found ${totalSettings} settings`);
  console.log('\n');

  if (totalStories === 0) {
    console.log('✅ No stories found. Database is already clean.\n');
    await sql.end();
    process.exit(0);
  }

  // Step 2: List story titles
  console.log('📖 Stories to be deleted:\n');
  const storyList = await sql`SELECT id, title FROM stories ORDER BY created_at DESC`;
  storyList.forEach((story, idx) => {
    console.log(`   ${idx + 1}. "${story.title}" (${story.id})`);
  });
  console.log('\n');

  // Step 3: Scan Vercel Blob for images
  console.log('🖼️  Step 2: Scanning Vercel Blob for images...\n');

  let totalBlobs = 0;
  let totalSize = 0;
  const blobsToDelete = [];

  try {
    const { blobs } = await list({
      limit: 10000,
    });

    // Filter for story-related images
    const storyBlobs = blobs.filter(
      (blob) =>
        blob.pathname.startsWith('story-images/') ||
        blob.pathname.startsWith('stories/')
    );

    totalBlobs = storyBlobs.length;
    totalSize = storyBlobs.reduce((sum, blob) => sum + blob.size, 0);
    blobsToDelete.push(...storyBlobs);

    console.log(`   Found ${totalBlobs} image files`);
    console.log(`   Total size: ${formatBytes(totalSize)}`);
    console.log('\n');
  } catch (error) {
    console.log(`   ⚠️  Could not list blobs: ${error.message}`);
    console.log('   Continuing with database cleanup...\n');
  }

  // Step 4: Show summary
  console.log('━'.repeat(80));
  console.log('\n📊 CLEANUP SUMMARY\n');
  console.log('━'.repeat(80));
  console.log('\n');
  console.log('Will delete:');
  console.log(`   • ${totalStories} stories`);
  console.log(`   • ${totalScenes} scenes`);
  console.log(`   • ${totalChapters} chapters`);
  console.log(`   • ${totalParts} parts`);
  console.log(`   • ${totalCharacters} characters`);
  console.log(`   • ${totalPlaces} places`);
  console.log(`   • ${totalSettings} settings`);
  console.log(`   • ${totalBlobs} image files (${formatBytes(totalSize)})`);
  console.log('\n');
  console.log('━'.repeat(80));
  console.log('\n⚠️  PROCEEDING WITH CLEANUP IN 3 SECONDS...\n');
  console.log('Press Ctrl+C to cancel\n');
  console.log('━'.repeat(80));
  console.log('\n');

  // Wait 3 seconds
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Step 5: Delete images from Vercel Blob
  if (blobsToDelete.length > 0) {
    console.log('🗑️  Step 3: Deleting images from Vercel Blob...\n');

    let deletedCount = 0;
    let failedCount = 0;

    for (const blob of blobsToDelete) {
      try {
        await del(blob.url);
        deletedCount++;
        if (deletedCount % 50 === 0 || deletedCount === blobsToDelete.length) {
          console.log(`   Deleted ${deletedCount}/${blobsToDelete.length} images...`);
        }
      } catch (error) {
        failedCount++;
        console.log(`   ✗ Failed to delete ${blob.pathname}: ${error.message}`);
      }

      // Small delay to avoid rate limits
      if (deletedCount % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`\n   ✓ Deleted ${deletedCount} images`);
    if (failedCount > 0) {
      console.log(`   ✗ Failed to delete ${failedCount} images`);
    }
    console.log('\n');
  }

  // Step 6: Delete from database (in order due to foreign keys)
  console.log('🗑️  Step 4: Deleting from database...\n');

  console.log('   Deleting scenes...');
  const deletedScenes = await sql`DELETE FROM scenes`;
  console.log(`   ✓ Deleted ${deletedScenes.count || 0} scenes`);

  console.log('   Deleting chapters...');
  const deletedChapters = await sql`DELETE FROM chapters`;
  console.log(`   ✓ Deleted ${deletedChapters.count || 0} chapters`);

  console.log('   Deleting parts...');
  const deletedParts = await sql`DELETE FROM parts`;
  console.log(`   ✓ Deleted ${deletedParts.count || 0} parts`);

  console.log('   Deleting characters...');
  const deletedCharacters = await sql`DELETE FROM characters`;
  console.log(`   ✓ Deleted ${deletedCharacters.count || 0} characters`);

  console.log('   Deleting places...');
  const deletedPlaces = await sql`DELETE FROM places`;
  console.log(`   ✓ Deleted ${deletedPlaces.count || 0} places`);

  console.log('   Deleting settings...');
  const deletedSettings = await sql`DELETE FROM settings`;
  console.log(`   ✓ Deleted ${deletedSettings.count || 0} settings`);

  console.log('   Deleting stories...');
  const deletedStories = await sql`DELETE FROM stories`;
  console.log(`   ✓ Deleted ${deletedStories.count || 0} stories`);

  console.log('\n');

  // Step 7: Verify cleanup
  console.log('✅ Step 5: Verifying cleanup...\n');

  const remainingStories = await sql`SELECT COUNT(*) as count FROM stories`;
  const remainingScenes = await sql`SELECT COUNT(*) as count FROM scenes`;
  const remainingCharacters = await sql`SELECT COUNT(*) as count FROM characters`;

  console.log(`   Stories remaining: ${remainingStories[0].count}`);
  console.log(`   Scenes remaining: ${remainingScenes[0].count}`);
  console.log(`   Characters remaining: ${remainingCharacters[0].count}`);
  console.log('\n');

  // Final summary
  console.log('━'.repeat(80));
  console.log('\n✅ CLEANUP COMPLETED SUCCESSFULLY!\n');
  console.log('━'.repeat(80));
  console.log('\n');
  console.log('Summary:');
  console.log(`   • Deleted ${totalStories} stories from database`);
  console.log(`   • Deleted ${blobsToDelete.length} images from Vercel Blob (${formatBytes(totalSize)})`);
  console.log(`   • All related data removed`);
  console.log('\n');
  console.log('The database is now clean and ready for new stories.');
  console.log('\n');

} catch (error) {
  console.error('\n❌ CLEANUP FAILED\n');
  console.error('Error:', error.message);
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  process.exit(1);
} finally {
  await sql.end();
}
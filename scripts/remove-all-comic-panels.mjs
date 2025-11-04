#!/usr/bin/env node

/**
 * Remove all comic panel data from database and Vercel Blob storage
 *
 * This script performs a complete cleanup of:
 * 1. Comic panel database records (comic_panels table)
 * 2. Comic-related scene metadata (comic_status, comic_panel_count, etc.)
 * 3. All comic panel images from Vercel Blob storage
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/remove-all-comic-panels.mjs
 *   dotenv --file .env.local run node scripts/remove-all-comic-panels.mjs --dry-run
 *   dotenv --file .env.local run node scripts/remove-all-comic-panels.mjs --confirm
 */

import { neon } from '@neondatabase/serverless';
import { list, del } from '@vercel/blob';

const isDryRun = process.argv.includes('--dry-run');
const isConfirmed = process.argv.includes('--confirm');

// Initialize database connection
const sql = neon(process.env.DATABASE_URL);

/**
 * Get all comic panels from database
 */
async function getAllComicPanels() {
  console.log('📊 Fetching comic panel data from database...');

  const panels = await sql`
    SELECT
      cp.id,
      cp.scene_id,
      cp.panel_number,
      cp.image_url,
      s.id as scene_id,
      st.id as story_id
    FROM comic_panels cp
    LEFT JOIN scenes s ON cp.scene_id = s.id
    LEFT JOIN chapters c ON s.chapter_id = c.id
    LEFT JOIN stories st ON c.story_id = st.id
    ORDER BY st.id, s.id, cp.panel_number
  `;

  console.log(`  Found ${panels.length} comic panels`);
  return panels;
}

/**
 * Get scenes with comic status
 */
async function getScenesWithComics() {
  console.log('📊 Fetching scenes with comic status...');

  const scenes = await sql`
    SELECT id, comic_status, comic_panel_count, comic_published_at
    FROM scenes
    WHERE comic_status != 'none'
  `;

  console.log(`  Found ${scenes.length} scenes with comic status`);
  return scenes;
}

/**
 * List all comic panel images from Vercel Blob
 */
async function listComicPanelImages() {
  console.log('📊 Listing comic panel images from Vercel Blob...');

  const allBlobs = [];
  let cursor;

  do {
    const response = await list({
      prefix: 'stories/',
      cursor,
    });

    // Filter for comic panel images
    const comicBlobs = response.blobs.filter(blob =>
      blob.pathname.includes('/comics/') && blob.pathname.endsWith('.png')
    );

    allBlobs.push(...comicBlobs);
    cursor = response.cursor;
  } while (cursor);

  console.log(`  Found ${allBlobs.length} comic panel images in Blob storage`);
  return allBlobs;
}

/**
 * Delete comic panel images from Vercel Blob
 */
async function deleteComicPanelImages(blobs) {
  if (blobs.length === 0) {
    console.log('✅ No comic panel images to delete from Blob storage');
    return 0;
  }

  console.log(`🗑️  Deleting ${blobs.length} images from Vercel Blob...`);

  const blobUrls = blobs.map(blob => blob.url);

  if (!isDryRun) {
    try {
      // Delete all blobs at once
      await del(blobUrls);
      console.log(`  ✅ Deleted ${blobUrls.length} images successfully`);
      return blobUrls.length;
    } catch (error) {
      console.error(`  ❌ Error deleting images:`, error.message);
      throw error;
    }
  } else {
    console.log(`  🔍 [DRY RUN] Would delete ${blobUrls.length} images`);
    blobs.slice(0, 5).forEach(blob => {
      console.log(`    - ${blob.pathname}`);
    });
    if (blobs.length > 5) {
      console.log(`    ... and ${blobs.length - 5} more`);
    }
    return 0;
  }
}

/**
 * Delete comic panel records from database
 */
async function deleteComicPanels(panels) {
  if (panels.length === 0) {
    console.log('✅ No comic panels to delete from database');
    return 0;
  }

  console.log(`🗑️  Deleting ${panels.length} comic panel records from database...`);

  if (!isDryRun) {
    try {
      const result = await sql`DELETE FROM comic_panels`;
      console.log(`  ✅ Deleted ${panels.length} comic panel records`);
      return panels.length;
    } catch (error) {
      console.error(`  ❌ Error deleting comic panels:`, error.message);
      throw error;
    }
  } else {
    console.log(`  🔍 [DRY RUN] Would delete ${panels.length} comic panel records`);
    return 0;
  }
}

/**
 * Reset comic status on scenes
 */
async function resetSceneComicStatus(scenes) {
  if (scenes.length === 0) {
    console.log('✅ No scenes to reset');
    return 0;
  }

  console.log(`🔄 Resetting comic status for ${scenes.length} scenes...`);

  if (!isDryRun) {
    try {
      const result = await sql`
        UPDATE scenes
        SET
          comic_status = 'none',
          comic_panel_count = 0,
          comic_published_at = NULL,
          comic_published_by = NULL,
          comic_unpublished_at = NULL,
          comic_unpublished_by = NULL,
          comic_generated_at = NULL,
          comic_version = 1
        WHERE comic_status != 'none'
      `;
      console.log(`  ✅ Reset ${scenes.length} scenes`);
      return scenes.length;
    } catch (error) {
      console.error(`  ❌ Error resetting scene status:`, error.message);
      throw error;
    }
  } else {
    console.log(`  🔍 [DRY RUN] Would reset ${scenes.length} scenes`);
    return 0;
  }
}

/**
 * Display summary before execution
 */
function displaySummary(panels, scenes, blobs) {
  console.log('\n📋 Summary of items to be removed:\n');
  console.log(`  Database Records:`);
  console.log(`    - Comic panels: ${panels.length}`);
  console.log(`    - Scenes with comic status: ${scenes.length}`);
  console.log(`\n  Vercel Blob Storage:`);
  console.log(`    - Comic panel images: ${blobs.length}`);

  if (panels.length > 0) {
    // Group by story
    const storyCounts = panels.reduce((acc, panel) => {
      const storyId = panel.story_id || 'unknown';
      acc[storyId] = (acc[storyId] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n  Panels by story:`);
    Object.entries(storyCounts).forEach(([storyId, count]) => {
      console.log(`    - ${storyId}: ${count} panels`);
    });
  }

  console.log('');
}

/**
 * Display final results
 */
function displayResults(results) {
  console.log('\n✅ Cleanup completed!\n');
  console.log(`  Deleted:`);
  console.log(`    - ${results.panelsDeleted} comic panel records`);
  console.log(`    - ${results.scenesReset} scene comic statuses`);
  console.log(`    - ${results.imagesDeleted} images from Vercel Blob`);
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Comic Panel Removal Script\n');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  try {
    // Step 1: Gather data
    const [panels, scenes, blobs] = await Promise.all([
      getAllComicPanels(),
      getScenesWithComics(),
      listComicPanelImages(),
    ]);

    // Step 2: Display summary
    displaySummary(panels, scenes, blobs);

    // Step 3: Confirm if not dry run and not already confirmed
    if (!isDryRun && !isConfirmed) {
      console.log('⚠️  This will permanently delete all comic panel data!');
      console.log('⚠️  Use --confirm flag to proceed or --dry-run to preview\n');
      process.exit(0);
    }

    if (!isDryRun && isConfirmed) {
      console.log('⚠️  CONFIRMED - Proceeding with deletion...\n');
    }

    // Step 4: Execute deletion
    const results = {
      panelsDeleted: 0,
      scenesReset: 0,
      imagesDeleted: 0,
    };

    // Delete in order: database records first, then Blob storage
    results.panelsDeleted = await deleteComicPanels(panels);
    results.scenesReset = await resetSceneComicStatus(scenes);
    results.imagesDeleted = await deleteComicPanelImages(blobs);

    // Step 5: Display results
    if (!isDryRun) {
      displayResults(results);
    } else {
      console.log('\n🔍 DRY RUN completed - no changes made');
      console.log('💡 Run with --confirm to execute deletion\n');
    }

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();

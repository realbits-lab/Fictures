#!/usr/bin/env node

/**
 * Reset All Data Script
 *
 * Resets database tables and Vercel Blob storage:
 * - Database: stories, parts, chapters, scenes, characters, settings
 * - Blob Storage: All images except system/ folder (fallback images)
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/reset-all-data.mjs [--dry-run] [--confirm]
 *
 * Options:
 *   --dry-run: Preview what would be deleted without making changes
 *   --confirm: Skip confirmation prompt (use with caution!)
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { list, del } from '@vercel/blob';
import readline from 'readline';

// Initialize database
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const skipConfirm = args.includes('--confirm');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log(`  ${title}`, 'bold');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
}

async function promptConfirmation(message) {
  if (skipConfirm) {
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${message} (yes/no): ${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function getDatabaseCounts() {
  log('Fetching current database counts...', 'blue');

  const counts = {};

  try {
    const storiesResult = await sql`SELECT COUNT(*) as count FROM stories`;
    counts.stories = parseInt(storiesResult[0].count);

    const partsResult = await sql`SELECT COUNT(*) as count FROM parts`;
    counts.parts = parseInt(partsResult[0].count);

    const chaptersResult = await sql`SELECT COUNT(*) as count FROM chapters`;
    counts.chapters = parseInt(chaptersResult[0].count);

    const scenesResult = await sql`SELECT COUNT(*) as count FROM scenes`;
    counts.scenes = parseInt(scenesResult[0].count);

    const charactersResult = await sql`SELECT COUNT(*) as count FROM characters`;
    counts.characters = parseInt(charactersResult[0].count);

    const settingsResult = await sql`SELECT COUNT(*) as count FROM settings`;
    counts.settings = parseInt(settingsResult[0].count);
  } catch (error) {
    log(`  ⚠ Error fetching counts: ${error.message}`, 'yellow');
    return {
      stories: 0,
      parts: 0,
      chapters: 0,
      scenes: 0,
      characters: 0,
      settings: 0,
    };
  }

  return counts;
}

async function getBlobCounts() {
  log('Fetching Vercel Blob counts...', 'blue');

  const counts = {
    total: 0,
    system: 0,
    toDelete: 0,
  };

  try {
    const { blobs } = await list();
    counts.total = blobs.length;

    for (const blob of blobs) {
      if (blob.pathname.startsWith('system/')) {
        counts.system++;
      } else {
        counts.toDelete++;
      }
    }
  } catch (error) {
    log(`  ⚠ Error listing blobs: ${error.message}`, 'yellow');
  }

  return counts;
}

async function resetDatabase() {
  logSection('DATABASE RESET');

  const beforeCounts = await getDatabaseCounts();

  log('\nCurrent database state:', 'cyan');
  for (const [table, count] of Object.entries(beforeCounts)) {
    log(`  ${table}: ${count} rows`, count > 0 ? 'yellow' : 'green');
  }

  const totalRows = Object.values(beforeCounts).reduce((sum, count) => sum + count, 0);

  if (totalRows === 0) {
    log('\n✓ Database is already empty', 'green');
    return { deleted: 0 };
  }

  if (isDryRun) {
    log(`\n[DRY RUN] Would delete ${totalRows} total rows`, 'yellow');
    return { deleted: 0 };
  }

  log(`\nDeleting ${totalRows} total rows...`, 'blue');

  // Delete in correct order (respecting foreign key constraints)
  const deletionOrder = [
    'scenes',
    'chapters',
    'parts',
    'characters',
    'settings',
    'stories',
  ];

  const deletedCounts = {};

  // Delete scenes
  try {
    await sql`DELETE FROM scenes`;
    deletedCounts.scenes = beforeCounts.scenes;
    log(`  ✓ Deleted ${beforeCounts.scenes} rows from scenes`, 'green');
  } catch (error) {
    log(`  ✗ Error deleting from scenes: ${error.message}`, 'red');
    deletedCounts.scenes = 0;
  }

  // Delete chapters
  try {
    await sql`DELETE FROM chapters`;
    deletedCounts.chapters = beforeCounts.chapters;
    log(`  ✓ Deleted ${beforeCounts.chapters} rows from chapters`, 'green');
  } catch (error) {
    log(`  ✗ Error deleting from chapters: ${error.message}`, 'red');
    deletedCounts.chapters = 0;
  }

  // Delete parts
  try {
    await sql`DELETE FROM parts`;
    deletedCounts.parts = beforeCounts.parts;
    log(`  ✓ Deleted ${beforeCounts.parts} rows from parts`, 'green');
  } catch (error) {
    log(`  ✗ Error deleting from parts: ${error.message}`, 'red');
    deletedCounts.parts = 0;
  }

  // Delete characters
  try {
    await sql`DELETE FROM characters`;
    deletedCounts.characters = beforeCounts.characters;
    log(`  ✓ Deleted ${beforeCounts.characters} rows from characters`, 'green');
  } catch (error) {
    log(`  ✗ Error deleting from characters: ${error.message}`, 'red');
    deletedCounts.characters = 0;
  }

  // Delete settings
  try {
    await sql`DELETE FROM settings`;
    deletedCounts.settings = beforeCounts.settings;
    log(`  ✓ Deleted ${beforeCounts.settings} rows from settings`, 'green');
  } catch (error) {
    log(`  ✗ Error deleting from settings: ${error.message}`, 'red');
    deletedCounts.settings = 0;
  }

  // Delete stories
  try {
    await sql`DELETE FROM stories`;
    deletedCounts.stories = beforeCounts.stories;
    log(`  ✓ Deleted ${beforeCounts.stories} rows from stories`, 'green');
  } catch (error) {
    log(`  ✗ Error deleting from stories: ${error.message}`, 'red');
    deletedCounts.stories = 0;
  }

  const totalDeleted = Object.values(deletedCounts).reduce((sum, count) => sum + count, 0);

  return { deleted: totalDeleted };
}

async function resetBlobStorage() {
  logSection('VERCEL BLOB STORAGE RESET');

  const beforeCounts = await getBlobCounts();

  log('\nCurrent Blob storage state:', 'cyan');
  log(`  Total blobs: ${beforeCounts.total}`, 'blue');
  log(`  System folder (keep): ${beforeCounts.system}`, 'green');
  log(`  Story images (delete): ${beforeCounts.toDelete}`, 'yellow');

  if (beforeCounts.toDelete === 0) {
    log('\n✓ No story images to delete', 'green');
    return { deleted: 0 };
  }

  if (isDryRun) {
    log(`\n[DRY RUN] Would delete ${beforeCounts.toDelete} blobs`, 'yellow');

    // Show sample of what would be deleted
    const { blobs } = await list({ limit: 10 });
    const samplesToDelete = blobs.filter(b => !b.pathname.startsWith('system/')).slice(0, 5);

    if (samplesToDelete.length > 0) {
      log('\nSample blobs to delete:', 'blue');
      for (const blob of samplesToDelete) {
        log(`  - ${blob.pathname}`, 'yellow');
      }
      if (beforeCounts.toDelete > samplesToDelete.length) {
        log(`  ... and ${beforeCounts.toDelete - samplesToDelete.length} more`, 'yellow');
      }
    }

    return { deleted: 0 };
  }

  log(`\nDeleting ${beforeCounts.toDelete} blobs...`, 'blue');

  let deletedCount = 0;
  let errorCount = 0;
  let cursor;

  do {
    const { blobs, cursor: nextCursor } = await list({ cursor });
    cursor = nextCursor;

    const blobsToDelete = blobs.filter(blob => !blob.pathname.startsWith('system/'));

    for (const blob of blobsToDelete) {
      try {
        await del(blob.url);
        deletedCount++;

        if (deletedCount % 10 === 0) {
          log(`  Progress: ${deletedCount}/${beforeCounts.toDelete} blobs deleted...`, 'blue');
        }
      } catch (error) {
        errorCount++;
        log(`  ⚠ Error deleting ${blob.pathname}: ${error.message}`, 'yellow');
      }
    }
  } while (cursor);

  log(`\n✓ Deleted ${deletedCount} blobs`, 'green');
  if (errorCount > 0) {
    log(`  ⚠ ${errorCount} errors occurred`, 'yellow');
  }

  return { deleted: deletedCount, errors: errorCount };
}

async function main() {
  logSection(isDryRun ? 'RESET ALL DATA (DRY RUN)' : 'RESET ALL DATA');

  if (isDryRun) {
    log('\n⚠ DRY RUN MODE - No changes will be made', 'yellow');
  } else {
    log('\n⚠ WARNING: This will permanently delete all story data!', 'red');
  }

  // Show preview
  log('\nFetching current state...', 'blue');
  const dbCounts = await getDatabaseCounts();
  const blobCounts = await getBlobCounts();

  const totalDbRows = Object.values(dbCounts).reduce((sum, count) => sum + count, 0);

  log('\nWhat will be reset:', 'cyan');
  log(`  Database rows: ${totalDbRows}`, totalDbRows > 0 ? 'yellow' : 'green');
  log(`  Blob images: ${blobCounts.toDelete}`, blobCounts.toDelete > 0 ? 'yellow' : 'green');
  log(`  System images (kept): ${blobCounts.system}`, 'green');

  if (totalDbRows === 0 && blobCounts.toDelete === 0) {
    log('\n✓ Nothing to reset - all data is already clean', 'green');
    process.exit(0);
  }

  // Confirmation
  if (!isDryRun) {
    console.log('');
    const confirmed = await promptConfirmation('Are you sure you want to proceed?');

    if (!confirmed) {
      log('\n✗ Reset cancelled', 'yellow');
      process.exit(0);
    }
  }

  // Execute reset
  const startTime = Date.now();

  const dbResult = await resetDatabase();
  const blobResult = await resetBlobStorage();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Summary
  logSection('RESET COMPLETE');

  log('\nResults:', 'cyan');
  log(`  Database rows deleted: ${dbResult.deleted}`, dbResult.deleted > 0 ? 'green' : 'blue');
  log(`  Blob images deleted: ${blobResult.deleted}`, blobResult.deleted > 0 ? 'green' : 'blue');
  log(`  Duration: ${duration}s`, 'blue');

  if (isDryRun) {
    log('\n⚠ This was a DRY RUN - no changes were made', 'yellow');
    log('Run without --dry-run to actually reset data', 'yellow');
  } else {
    log('\n✓ All data has been reset successfully', 'green');
  }
}

// Run script
main().catch((error) => {
  log('\n✗ Fatal error:', 'red');
  console.error(error);
  process.exit(1);
});

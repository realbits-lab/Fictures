/**
 * Cleanup Script: Remove All Stories and Vercel Blob Files
 *
 * This script will:
 * 1. Delete all Vercel Blob files (character images, setting images, story images)
 * 2. Delete all stories and related data from the database
 *
 * WARNING: This is a destructive operation and cannot be undone!
 */

import { db } from '../src/lib/db/index';
import { stories, characters, settings, parts, chapters, scenes } from '../src/lib/db/schema';
import { list, del } from '@vercel/blob';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function deleteAllBlobFiles() {
  log('\n🗑️  DELETING VERCEL BLOB FILES', 'yellow');
  log('================================================================================', 'yellow');

  try {
    let deletedCount = 0;
    let hasMore = true;
    let cursor;

    while (hasMore) {
      const listResult = await list({
        cursor,
        limit: 1000, // Maximum limit per request
      });

      if (listResult.blobs.length === 0) {
        break;
      }

      log(`\nFound ${listResult.blobs.length} files to delete...`, 'cyan');

      // Delete files in batches
      for (const blob of listResult.blobs) {
        try {
          await del(blob.url);
          deletedCount++;
          if (deletedCount % 10 === 0) {
            process.stdout.write(`\r${colors.green}Deleted ${deletedCount} files...${colors.reset}`);
          }
        } catch (error) {
          log(`\n❌ Failed to delete ${blob.pathname}: ${error.message}`, 'red');
        }
      }

      hasMore = listResult.hasMore;
      cursor = listResult.cursor;
    }

    log(`\n✅ Successfully deleted ${deletedCount} Vercel Blob files`, 'green');
    return deletedCount;
  } catch (error) {
    log(`\n❌ Error deleting blob files: ${error.message}`, 'red');
    throw error;
  }
}

async function deleteAllDatabaseRecords() {
  log('\n🗑️  DELETING DATABASE RECORDS', 'yellow');
  log('================================================================================', 'yellow');

  try {
    // Get counts before deletion
    const storyCount = await db.select().from(stories);
    const characterCount = await db.select().from(characters);
    const settingCount = await db.select().from(settings);
    const partCount = await db.select().from(parts);
    const chapterCount = await db.select().from(chapters);
    const sceneCount = await db.select().from(scenes);

    log(`\n📊 Current Database State:`, 'cyan');
    log(`   Stories: ${storyCount.length}`, 'cyan');
    log(`   Characters: ${characterCount.length}`, 'cyan');
    log(`   Settings: ${settingCount.length}`, 'cyan');
    log(`   Parts: ${partCount.length}`, 'cyan');
    log(`   Chapters: ${chapterCount.length}`, 'cyan');
    log(`   Scenes: ${sceneCount.length}`, 'cyan');

    // Delete in correct order (child records first, then parent records)
    log('\n🗑️  Deleting scenes...', 'yellow');
    await db.delete(scenes);
    log('✅ Scenes deleted', 'green');

    log('🗑️  Deleting chapters...', 'yellow');
    await db.delete(chapters);
    log('✅ Chapters deleted', 'green');

    log('🗑️  Deleting parts...', 'yellow');
    await db.delete(parts);
    log('✅ Parts deleted', 'green');

    log('🗑️  Deleting characters...', 'yellow');
    await db.delete(characters);
    log('✅ Characters deleted', 'green');

    log('🗑️  Deleting settings...', 'yellow');
    await db.delete(settings);
    log('✅ Settings deleted', 'green');

    log('🗑️  Deleting stories...', 'yellow');
    await db.delete(stories);
    log('✅ Stories deleted', 'green');

    log('\n✅ Successfully deleted all database records:', 'green');
    log(`   ✓ ${sceneCount.length} scenes`, 'green');
    log(`   ✓ ${chapterCount.length} chapters`, 'green');
    log(`   ✓ ${partCount.length} parts`, 'green');
    log(`   ✓ ${characterCount.length} characters`, 'green');
    log(`   ✓ ${settingCount.length} settings`, 'green');
    log(`   ✓ ${storyCount.length} stories`, 'green');

    return {
      stories: storyCount.length,
      characters: characterCount.length,
      settings: settingCount.length,
      parts: partCount.length,
      chapters: chapterCount.length,
      scenes: sceneCount.length,
    };
  } catch (error) {
    log(`\n❌ Error deleting database records: ${error.message}`, 'red');
    throw error;
  }
}

async function confirmDeletion() {
  log('\n⚠️  WARNING: DESTRUCTIVE OPERATION', 'red');
  log('================================================================================', 'red');
  log('This will permanently delete:', 'yellow');
  log('  • All Vercel Blob files (images)', 'yellow');
  log('  • All stories and related database records', 'yellow');
  log('\n❌ This action CANNOT be undone!', 'red');
  log('================================================================================\n', 'red');

  // Check if running in interactive mode
  if (process.stdin.isTTY) {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question('Type "DELETE ALL" to confirm: ', (answer) => {
        rl.close();
        resolve(answer.trim() === 'DELETE ALL');
      });
    });
  } else {
    // Non-interactive mode - require --force flag
    const hasForceFlag = process.argv.includes('--force');
    if (!hasForceFlag) {
      log('❌ Non-interactive mode requires --force flag', 'red');
      log('Usage: node scripts/cleanup-all-stories.mjs --force', 'yellow');
      return false;
    }
    return true;
  }
}

async function main() {
  log('\n🧹 CLEANUP SCRIPT: Remove All Stories and Blob Files', 'cyan');
  log('================================================================================', 'cyan');

  try {
    // Confirm deletion
    const confirmed = await confirmDeletion();

    if (!confirmed) {
      log('\n❌ Cleanup cancelled by user', 'yellow');
      process.exit(0);
    }

    log('\n🚀 Starting cleanup process...', 'green');

    // Step 1: Delete all Vercel Blob files
    const blobCount = await deleteAllBlobFiles();

    // Step 2: Delete all database records
    const dbCounts = await deleteAllDatabaseRecords();

    // Final summary
    log('\n================================================================================', 'green');
    log('✅ CLEANUP COMPLETED SUCCESSFULLY', 'green');
    log('================================================================================', 'green');
    log(`\n📊 Summary:`, 'cyan');
    log(`   🗑️  Vercel Blob files deleted: ${blobCount}`, 'cyan');
    log(`   📚 Stories deleted: ${dbCounts.stories}`, 'cyan');
    log(`   👥 Characters deleted: ${dbCounts.characters}`, 'cyan');
    log(`   🏞️  Settings deleted: ${dbCounts.settings}`, 'cyan');
    log(`   📖 Parts deleted: ${dbCounts.parts}`, 'cyan');
    log(`   📝 Chapters deleted: ${dbCounts.chapters}`, 'cyan');
    log(`   🎬 Scenes deleted: ${dbCounts.scenes}`, 'cyan');
    log('\n✨ All data has been successfully removed!\n', 'green');

    process.exit(0);
  } catch (error) {
    log('\n❌ CLEANUP FAILED', 'red');
    log(`Error: ${error.message}`, 'red');
    log(`Stack: ${error.stack}`, 'red');
    process.exit(1);
  }
}

// Run the script
main();

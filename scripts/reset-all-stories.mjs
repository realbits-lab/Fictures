#!/usr/bin/env node

/**
 * Reset All Stories Script
 *
 * Comprehensive cleanup script that removes ALL story-related data:
 * - Database records (stories, parts, chapters, scenes, characters, settings, community data)
 * - Vercel Blob storage (all images under stories/ prefix)
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/reset-all-stories.mjs --confirm
 *   dotenv --file .env.local run node scripts/reset-all-stories.mjs --dry-run
 */

import postgres from 'postgres';
import { list, del } from '@vercel/blob';
import { createClient } from 'redis';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isConfirmed = args.includes('--confirm');

if (!isDryRun && !isConfirmed) {
  console.error('❌ Error: This will DELETE ALL STORY DATA');
  console.error('');
  console.error('Usage:');
  console.error('  --dry-run    Preview what will be deleted (safe)');
  console.error('  --confirm    Actually delete all data (DESTRUCTIVE)');
  console.error('');
  console.error('Example:');
  console.error('  dotenv --file .env.local run node scripts/reset-all-stories.mjs --dry-run');
  console.error('  dotenv --file .env.local run node scripts/reset-all-stories.mjs --confirm');
  process.exit(1);
}

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Error: DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = postgres(connectionString);

// Vercel Blob token
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
if (!blobToken) {
  console.error('❌ Error: BLOB_READ_WRITE_TOKEN not found in environment');
  process.exit(1);
}

// Redis client
const redisClient = createClient({ url: process.env.REDIS_URL });
if (!process.env.REDIS_URL) {
  console.error('❌ Error: REDIS_URL not found in environment');
  process.exit(1);
}

/**
 * Get statistics about what will be deleted
 */
async function getStatistics() {
  console.log('\n📊 Collecting statistics...\n');

  const stats = {
    stories: 0,
    parts: 0,
    chapters: 0,
    scenes: 0,
    comicPanels: 0,
    sceneViews: 0,
    characters: 0,
    settings: 0,
    sceneEvaluations: 0,
    communityPosts: 0,
    communityReplies: 0,
    postLikes: 0,
    postViews: 0,
    comments: 0,
    commentLikes: 0,
    storyLikes: 0,
    chapterLikes: 0,
    sceneLikes: 0,
    commentDislikes: 0,
    sceneDislikes: 0,
    readingSessions: 0,
    readingHistory: 0,
    storyInsights: 0,
    analyticsEvents: 0,
    aiInteractions: 0,
    publishingSchedules: 0,
    scheduledPublications: 0,
    blobImages: 0,
    redisCacheKeys: 0,
  };

  // Count database records
  const counts = await Promise.all([
    sql`SELECT COUNT(*) as count FROM stories`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM parts`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM chapters`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM scenes`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM comic_panels`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM scene_views`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM characters`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM settings`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM scene_evaluations`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM community_posts`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM community_replies`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM post_likes`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM post_views`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM comments`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM comment_likes`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM story_likes`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM chapter_likes`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM scene_likes`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM comment_dislikes`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM scene_dislikes`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM reading_sessions`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM reading_history`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM story_insights`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM analytics_events`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM ai_interactions`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM publishing_schedules`.then(r => parseInt(r[0].count)),
    sql`SELECT COUNT(*) as count FROM scheduled_publications`.then(r => parseInt(r[0].count)),
  ]);

  stats.stories = counts[0];
  stats.parts = counts[1];
  stats.chapters = counts[2];
  stats.scenes = counts[3];
  stats.comicPanels = counts[4];
  stats.sceneViews = counts[5];
  stats.characters = counts[6];
  stats.settings = counts[7];
  stats.sceneEvaluations = counts[8];
  stats.communityPosts = counts[9];
  stats.communityReplies = counts[10];
  stats.postLikes = counts[11];
  stats.postViews = counts[12];
  stats.comments = counts[13];
  stats.commentLikes = counts[14];
  stats.storyLikes = counts[15];
  stats.chapterLikes = counts[16];
  stats.sceneLikes = counts[17];
  stats.commentDislikes = counts[18];
  stats.sceneDislikes = counts[19];
  stats.readingSessions = counts[20];
  stats.readingHistory = counts[21];
  stats.storyInsights = counts[22];
  stats.analyticsEvents = counts[23];
  stats.aiInteractions = counts[24];
  stats.publishingSchedules = counts[25];
  stats.scheduledPublications = counts[26];

  // Count Vercel Blob images
  console.log('🔍 Scanning Vercel Blob storage...');
  let blobCursor;
  let totalBlobs = 0;

  do {
    const response = await list({
      prefix: 'stories/',
      cursor: blobCursor,
      token: blobToken,
    });

    totalBlobs += response.blobs.length;
    blobCursor = response.cursor;

    if (response.blobs.length > 0) {
      console.log(`   Found ${response.blobs.length} images (total: ${totalBlobs})...`);
    }
  } while (blobCursor);

  stats.blobImages = totalBlobs;

  // Count Redis cache keys
  console.log('🔍 Scanning Redis cache...');
  try {
    await redisClient.connect();

    const patterns = [
      'story:*',
      'chapter:*',
      'scene:*',
      'user:*:stories*',
      'stories:*',
      'community:*',
    ];

    let totalKeys = 0;
    for (const pattern of patterns) {
      const keys = await redisClient.keys(pattern);
      totalKeys += keys.length;
      if (keys.length > 0) {
        console.log(`   Pattern "${pattern}": ${keys.length} keys`);
      }
    }

    stats.redisCacheKeys = totalKeys;
    await redisClient.disconnect();
  } catch (error) {
    console.error('   ⚠️  Redis scan failed:', error.message);
    await redisClient.disconnect().catch(() => {});
  }

  return stats;
}

/**
 * Display statistics
 */
function displayStatistics(stats) {
  console.log('\n📋 What will be deleted:\n');
  console.log('Database Records:');
  console.log(`  Stories:                 ${stats.stories}`);
  console.log(`  Parts:                   ${stats.parts}`);
  console.log(`  Chapters:                ${stats.chapters}`);
  console.log(`  Scenes:                  ${stats.scenes}`);
  console.log(`  Comic Panels:            ${stats.comicPanels}`);
  console.log(`  Scene Views:             ${stats.sceneViews}`);
  console.log(`  Characters:              ${stats.characters}`);
  console.log(`  Settings:                ${stats.settings}`);
  console.log(`  Scene Evaluations:       ${stats.sceneEvaluations}`);
  console.log(`  Community Posts:         ${stats.communityPosts}`);
  console.log(`  Community Replies:       ${stats.communityReplies}`);
  console.log(`  Post Likes:              ${stats.postLikes}`);
  console.log(`  Post Views:              ${stats.postViews}`);
  console.log(`  Comments:                ${stats.comments}`);
  console.log(`  Comment Likes:           ${stats.commentLikes}`);
  console.log(`  Story Likes:             ${stats.storyLikes}`);
  console.log(`  Chapter Likes:           ${stats.chapterLikes}`);
  console.log(`  Scene Likes:             ${stats.sceneLikes}`);
  console.log(`  Comment Dislikes:        ${stats.commentDislikes}`);
  console.log(`  Scene Dislikes:          ${stats.sceneDislikes}`);
  console.log(`  Reading Sessions:        ${stats.readingSessions}`);
  console.log(`  Reading History:         ${stats.readingHistory}`);
  console.log(`  Story Insights:          ${stats.storyInsights}`);
  console.log(`  Analytics Events:        ${stats.analyticsEvents}`);
  console.log(`  AI Interactions:         ${stats.aiInteractions}`);
  console.log(`  Publishing Schedules:    ${stats.publishingSchedules}`);
  console.log(`  Scheduled Publications:  ${stats.scheduledPublications}`);
  console.log('');
  console.log('Vercel Blob Storage:');
  console.log(`  Images:                  ${stats.blobImages}`);
  console.log('');
  console.log('Redis Cache:');
  console.log(`  Cache Keys:              ${stats.redisCacheKeys}`);
  console.log('');

  const totalDbRecords = Object.values(stats).reduce((sum, val) => sum + val, 0) - stats.blobImages - stats.redisCacheKeys;
  console.log(`Total: ${totalDbRecords} database records + ${stats.blobImages} blob images + ${stats.redisCacheKeys} cache keys`);
}

/**
 * Delete all Vercel Blob images
 */
async function deleteAllBlobImages() {
  console.log('\n🗑️  Deleting Vercel Blob images...\n');

  let blobCursor;
  let deletedCount = 0;
  const batchSize = 100;

  do {
    const response = await list({
      prefix: 'stories/',
      cursor: blobCursor,
      token: blobToken,
    });

    if (response.blobs.length === 0) {
      break;
    }

    // Delete in batches
    const urls = response.blobs.map(blob => blob.url);

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      await Promise.all(batch.map(url => del(url, { token: blobToken })));
      deletedCount += batch.length;
      console.log(`   Deleted ${deletedCount} images...`);
    }

    blobCursor = response.cursor;
  } while (blobCursor);

  console.log(`✅ Deleted ${deletedCount} images from Vercel Blob`);
  return deletedCount;
}

/**
 * Delete all database records
 */
async function deleteAllDatabaseRecords() {
  console.log('\n🗑️  Deleting database records...\n');

  const deletedCounts = {};

  // Delete in reverse order of dependencies
  console.log('   Deleting scheduled publications...');
  deletedCounts.scheduledPublications = (await sql`DELETE FROM scheduled_publications`).count || 0;

  console.log('   Deleting publishing schedules...');
  deletedCounts.publishingSchedules = (await sql`DELETE FROM publishing_schedules`).count || 0;

  console.log('   Deleting analytics events...');
  deletedCounts.analyticsEvents = (await sql`DELETE FROM analytics_events`).count || 0;

  console.log('   Deleting story insights...');
  deletedCounts.storyInsights = (await sql`DELETE FROM story_insights`).count || 0;

  console.log('   Deleting reading sessions...');
  deletedCounts.readingSessions = (await sql`DELETE FROM reading_sessions`).count || 0;

  console.log('   Deleting reading history...');
  deletedCounts.readingHistory = (await sql`DELETE FROM reading_history`).count || 0;

  console.log('   Deleting comment dislikes...');
  deletedCounts.commentDislikes = (await sql`DELETE FROM comment_dislikes`).count || 0;

  console.log('   Deleting scene dislikes...');
  deletedCounts.sceneDislikes = (await sql`DELETE FROM scene_dislikes`).count || 0;

  console.log('   Deleting comment likes...');
  deletedCounts.commentLikes = (await sql`DELETE FROM comment_likes`).count || 0;

  console.log('   Deleting scene likes...');
  deletedCounts.sceneLikes = (await sql`DELETE FROM scene_likes`).count || 0;

  console.log('   Deleting chapter likes...');
  deletedCounts.chapterLikes = (await sql`DELETE FROM chapter_likes`).count || 0;

  console.log('   Deleting story likes...');
  deletedCounts.storyLikes = (await sql`DELETE FROM story_likes`).count || 0;

  console.log('   Deleting comments...');
  deletedCounts.comments = (await sql`DELETE FROM comments`).count || 0;

  console.log('   Deleting post views...');
  deletedCounts.postViews = (await sql`DELETE FROM post_views`).count || 0;

  console.log('   Deleting post likes...');
  deletedCounts.postLikes = (await sql`DELETE FROM post_likes`).count || 0;

  console.log('   Deleting community replies...');
  deletedCounts.communityReplies = (await sql`DELETE FROM community_replies`).count || 0;

  console.log('   Deleting community posts...');
  deletedCounts.communityPosts = (await sql`DELETE FROM community_posts`).count || 0;

  console.log('   Deleting scene evaluations...');
  deletedCounts.sceneEvaluations = (await sql`DELETE FROM scene_evaluations`).count || 0;

  console.log('   Deleting scene views...');
  deletedCounts.sceneViews = (await sql`DELETE FROM scene_views`).count || 0;

  console.log('   Deleting comic panels...');
  deletedCounts.comicPanels = (await sql`DELETE FROM comic_panels`).count || 0;

  console.log('   Deleting AI interactions...');
  deletedCounts.aiInteractions = (await sql`DELETE FROM ai_interactions`).count || 0;

  console.log('   Deleting scenes...');
  deletedCounts.scenes = (await sql`DELETE FROM scenes`).count || 0;

  console.log('   Deleting settings...');
  deletedCounts.settings = (await sql`DELETE FROM settings`).count || 0;

  console.log('   Deleting characters...');
  deletedCounts.characters = (await sql`DELETE FROM characters`).count || 0;

  console.log('   Deleting chapters...');
  deletedCounts.chapters = (await sql`DELETE FROM chapters`).count || 0;

  console.log('   Deleting parts...');
  deletedCounts.parts = (await sql`DELETE FROM parts`).count || 0;

  console.log('   Deleting stories...');
  deletedCounts.stories = (await sql`DELETE FROM stories`).count || 0;

  console.log('\n✅ Database cleanup complete:');
  Object.entries(deletedCounts).forEach(([table, count]) => {
    console.log(`   ${table}: ${count} records`);
  });

  return deletedCounts;
}

/**
 * Delete all Redis cache keys
 */
async function deleteAllRedisCacheKeys() {
  console.log('\n🗑️  Deleting Redis cache keys...\n');

  try {
    await redisClient.connect();

    const patterns = [
      'story:*',
      'chapter:*',
      'scene:*',
      'user:*:stories*',
      'stories:*',
      'community:*',
    ];

    let totalDeleted = 0;

    for (const pattern of patterns) {
      const keys = await redisClient.keys(pattern);

      if (keys.length > 0) {
        console.log(`   Deleting ${keys.length} keys matching "${pattern}"...`);

        for (const key of keys) {
          await redisClient.del(key);
        }

        totalDeleted += keys.length;
      }
    }

    console.log(`\n✅ Deleted ${totalDeleted} cache keys from Redis`);
    await redisClient.disconnect();
    return totalDeleted;

  } catch (error) {
    console.error('   ⚠️  Redis deletion failed:', error.message);
    await redisClient.disconnect().catch(() => {});
    return 0;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🔄 Story Data Reset Script\n');
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (preview only)' : '⚠️  DESTRUCTIVE (will delete data)'}`);

  try {
    // Get and display statistics
    const stats = await getStatistics();
    displayStatistics(stats);

    if (isDryRun) {
      console.log('\n✅ Dry run complete - no data was modified');
      console.log('Run with --confirm to actually delete all data');
      return;
    }

    // Final confirmation in destructive mode
    console.log('\n⚠️  WARNING: This will permanently delete ALL story data!');
    console.log('Press Ctrl+C now to cancel...\n');

    // Wait 3 seconds before proceeding
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Execute deletions
    const startTime = Date.now();

    // Delete Blob images and DB records in parallel, then cache
    const [blobCount, dbCounts] = await Promise.all([
      deleteAllBlobImages(),
      deleteAllDatabaseRecords(),
    ]);

    // Delete cache keys after DB deletion (some caches reference DB data)
    const cacheCount = await deleteAllRedisCacheKeys();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n✅ Reset complete!');
    console.log(`   Duration: ${duration}s`);
    console.log(`   Database records deleted: ${Object.values(dbCounts).reduce((sum, val) => sum + val, 0)}`);
    console.log(`   Blob images deleted: ${blobCount}`);
    console.log(`   Cache keys deleted: ${cacheCount}`);

  } catch (error) {
    console.error('\n❌ Error during reset:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

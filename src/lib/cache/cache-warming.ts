/**
 * Cache Warming Utility
 *
 * Pre-load frequently accessed stories into cache to minimize cache misses
 * Run this periodically or on-demand to improve read performance
 */

import { warmStoryCache } from './story-structure-cache';
import { db } from '../db';
import { stories } from '../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

/**
 * Warm cache for all published stories
 * Run this after deployment or when cache is cleared
 */
export async function warmPublishedStories(): Promise<void> {
  console.log('[Cache Warming] 🔥 Warming cache for published stories...');

  const startTime = Date.now();

  // Get all published story IDs
  const publishedStories = await db.query.stories.findMany({
    where: eq(stories.status, 'published'),
    columns: { id: true },
    limit: 100, // Warm top 100 published stories
    orderBy: [desc(stories.updatedAt)],
  });

  const storyIds = publishedStories.map(s => s.id);

  await warmStoryCache(storyIds);

  const duration = Date.now() - startTime;
  console.log(`[Cache Warming] ✅ Warmed ${storyIds.length} published stories in ${duration}ms (${(duration / storyIds.length).toFixed(2)}ms per story)`);
}

/**
 * Warm cache for stories updated in the last N hours
 * Run this periodically (e.g., every hour) to keep recent stories cached
 */
export async function warmRecentlyUpdatedStories(hoursBack: number = 24): Promise<void> {
  console.log(`[Cache Warming] 🔥 Warming cache for stories updated in last ${hoursBack} hours...`);

  const startTime = Date.now();
  const cutoffDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const recentStories = await db.query.stories.findMany({
    where: sql`${stories.updatedAt} >= ${cutoffDate.toISOString()}`,
    columns: { id: true },
    limit: 50,
    orderBy: [desc(stories.updatedAt)],
  });

  const storyIds = recentStories.map(s => s.id);

  await warmStoryCache(storyIds);

  const duration = Date.now() - startTime;
  console.log(`[Cache Warming] ✅ Warmed ${storyIds.length} recent stories in ${duration}ms`);
}

/**
 * Warm cache for a specific user's stories
 * Call this when a user logs in to pre-load their content
 */
export async function warmUserStories(userId: string): Promise<void> {
  console.log(`[Cache Warming] 🔥 Warming cache for user ${userId} stories...`);

  const startTime = Date.now();

  const userStories = await db.query.stories.findMany({
    where: eq(stories.authorId, userId),
    columns: { id: true },
    limit: 20, // Warm user's top 20 stories
    orderBy: [desc(stories.updatedAt)],
  });

  const storyIds = userStories.map(s => s.id);

  if (storyIds.length > 0) {
    await warmStoryCache(storyIds);

    const duration = Date.now() - startTime;
    console.log(`[Cache Warming] ✅ Warmed ${storyIds.length} user stories in ${duration}ms`);
  } else {
    console.log(`[Cache Warming] ℹ️ No stories found for user ${userId}`);
  }
}

/**
 * Warm cache for specific story IDs
 * Useful for warming stories about to be featured or promoted
 */
export async function warmSpecificStories(storyIds: string[]): Promise<void> {
  console.log(`[Cache Warming] 🔥 Warming cache for ${storyIds.length} specific stories...`);

  const startTime = Date.now();

  await warmStoryCache(storyIds);

  const duration = Date.now() - startTime;
  console.log(`[Cache Warming] ✅ Warmed ${storyIds.length} stories in ${duration}ms`);
}

/**
 * Scheduled cache warming task
 * Run this via cron job or API endpoint every hour
 */
export async function scheduledCacheWarming(): Promise<void> {
  console.log('[Cache Warming] 🕐 Running scheduled cache warming...');

  const startTime = Date.now();

  try {
    // Warm published stories (highest priority)
    await warmPublishedStories();

    // Warm recently updated stories
    await warmRecentlyUpdatedStories(12); // Last 12 hours

    const duration = Date.now() - startTime;
    console.log(`[Cache Warming] ✅ Scheduled warming completed in ${duration}ms`);
  } catch (error) {
    console.error('[Cache Warming] ❌ Scheduled warming failed:', error);
    throw error;
  }
}

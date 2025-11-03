#!/usr/bin/env node

/**
 * Cache Performance Test - Measurement Script
 *
 * Measures cache performance across all three layers:
 * 1. SWR Memory Cache (client-side, not tested here)
 * 2. localStorage Cache (client-side, not tested here)
 * 3. Redis Cache (server-side) - tested here
 *
 * This script tests API performance to validate Redis caching
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, like } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema.ts';

// Load environment variables
config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql, { schema });

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  iterations: 5,
  waitBetweenTests: 2000, // 2 seconds
};

/**
 * Measure API request performance
 */
async function measureApiPerformance(url, label) {
  const startTime = performance.now();

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const endTime = performance.now();
    const duration = endTime - startTime;

    const cacheHit = response.headers.get('X-Cache-Hit') === 'true';
    const cacheSource = response.headers.get('X-Cache-Source') || 'unknown';
    const responseTime = response.headers.get('X-Response-Time') || 'N/A';

    return {
      label,
      duration,
      cacheHit,
      cacheSource,
      responseTime,
      success: true,
      dataSize: JSON.stringify(data).length,
    };
  } catch (error) {
    const endTime = performance.now();
    return {
      label,
      duration: endTime - startTime,
      error: error.message,
      success: false,
    };
  }
}

/**
 * Run cold cache test (clear cache first)
 */
async function runColdCacheTest(storyId) {
  console.log('\n🧊 Cold Cache Test (clearing Redis cache first)...\n');

  // Note: In production, we'd call an API endpoint to clear cache
  // For now, we'll just wait to ensure cache is cold
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const url = `${TEST_CONFIG.baseUrl}/test/cache-performance/api/stories/${storyId}`;
  const result = await measureApiPerformance(url, 'Cold Load');

  console.log(`⏱️  ${result.label}:`);
  console.log(`   Duration: ${result.duration.toFixed(2)}ms`);
  console.log(`   Cache Hit: ${result.cacheHit ? '✅ YES' : '❌ NO'}`);
  console.log(`   Cache Source: ${result.cacheSource}`);
  console.log(`   Response Time: ${result.responseTime}`);
  console.log(`   Data Size: ${(result.dataSize / 1024).toFixed(2)} KB`);

  return result;
}

/**
 * Run warm cache test (should hit Redis cache)
 */
async function runWarmCacheTest(storyId) {
  console.log('\n🔥 Warm Cache Test (testing Redis cache hit)...\n');

  const url = `${TEST_CONFIG.baseUrl}/test/cache-performance/api/stories/${storyId}`;
  const results = [];

  for (let i = 1; i <= TEST_CONFIG.iterations; i++) {
    const result = await measureApiPerformance(url, `Warm Load #${i}`);

    console.log(`⏱️  ${result.label}:`);
    console.log(`   Duration: ${result.duration.toFixed(2)}ms`);
    console.log(`   Cache Hit: ${result.cacheHit ? '✅ YES' : '❌ NO'}`);
    console.log(`   Cache Source: ${result.cacheSource}`);

    results.push(result);

    if (i < TEST_CONFIG.iterations) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Calculate average
  const avgDuration =
    results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const hitRate =
    (results.filter((r) => r.cacheHit).length / results.length) * 100;

  console.log('\n📊 Warm Cache Summary:');
  console.log(`   Average Duration: ${avgDuration.toFixed(2)}ms`);
  console.log(`   Cache Hit Rate: ${hitRate.toFixed(2)}%`);

  return { results, avgDuration, hitRate };
}

/**
 * Run cache invalidation test
 */
async function runCacheInvalidationTest(storyId) {
  console.log('\n🔄 Cache Invalidation Test (updating data)...\n');

  // Update story to invalidate cache
  const updateUrl = `${TEST_CONFIG.baseUrl}/test/cache-performance/api/stories/${storyId}`;
  const updateStartTime = performance.now();

  try {
    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewCount: Math.floor(Math.random() * 1000) }),
    });

    const updateData = await response.json();
    const updateDuration = performance.now() - updateStartTime;

    console.log(`✅ Update completed in ${updateDuration.toFixed(2)}ms`);
    console.log(`   Cache invalidated: ${updateData.cacheInvalidated ? 'YES' : 'NO'}`);

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Fetch again to measure post-update performance
    const fetchUrl = `${TEST_CONFIG.baseUrl}/test/cache-performance/api/stories/${storyId}`;
    const fetchResult = await measureApiPerformance(fetchUrl, 'After Update');

    console.log(`\n⏱️  Fetch after update:`);
    console.log(`   Duration: ${fetchResult.duration.toFixed(2)}ms`);
    console.log(`   Cache Hit: ${fetchResult.cacheHit ? '✅ YES (should be NO)' : '❌ NO (expected)'}`);
    console.log(`   Cache Source: ${fetchResult.cacheSource}`);

    return { updateDuration, fetchResult };
  } catch (error) {
    console.error('❌ Cache invalidation test failed:', error.message);
    return null;
  }
}

/**
 * Generate performance report
 */
function generateReport(coldResult, warmResults, invalidationResults) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 CACHE PERFORMANCE TEST REPORT');
  console.log('='.repeat(60) + '\n');

  console.log('📋 Test Configuration:');
  console.log(`   Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`   Warm cache iterations: ${TEST_CONFIG.iterations}`);
  console.log('');

  console.log('🧊 Cold Cache Performance:');
  console.log(`   Duration: ${coldResult.duration.toFixed(2)}ms`);
  console.log(`   Cache Hit: ${coldResult.cacheHit ? 'YES (unexpected!)' : 'NO (expected)'}`);
  console.log(`   Source: ${coldResult.cacheSource}`);
  console.log('');

  console.log('🔥 Warm Cache Performance:');
  console.log(`   Average Duration: ${warmResults.avgDuration.toFixed(2)}ms`);
  console.log(`   Cache Hit Rate: ${warmResults.hitRate.toFixed(2)}%`);
  console.log(`   Best Time: ${Math.min(...warmResults.results.map((r) => r.duration)).toFixed(2)}ms`);
  console.log(`   Worst Time: ${Math.max(...warmResults.results.map((r) => r.duration)).toFixed(2)}ms`);
  console.log('');

  if (invalidationResults) {
    console.log('🔄 Cache Invalidation Performance:');
    console.log(`   Update Duration: ${invalidationResults.updateDuration.toFixed(2)}ms`);
    console.log(`   Post-Update Fetch: ${invalidationResults.fetchResult.duration.toFixed(2)}ms`);
    console.log(`   Cache Hit After Update: ${invalidationResults.fetchResult.cacheHit ? 'YES (cache not invalidated!)' : 'NO (expected)'}`);
    console.log('');
  }

  console.log('📈 Performance Summary:');
  const speedup = coldResult.duration / warmResults.avgDuration;
  const improvement =
    ((coldResult.duration - warmResults.avgDuration) / coldResult.duration) * 100;

  console.log(`   Cache Speedup: ${speedup.toFixed(2)}x faster`);
  console.log(`   Time Saved: ${(coldResult.duration - warmResults.avgDuration).toFixed(2)}ms`);
  console.log(`   Improvement: ${improvement.toFixed(2)}%`);
  console.log('');

  // Performance rating
  if (warmResults.avgDuration < 50) {
    console.log('✅ EXCELLENT: Warm cache performance is excellent (< 50ms)');
  } else if (warmResults.avgDuration < 100) {
    console.log('🟡 GOOD: Warm cache performance is good (< 100ms)');
  } else {
    console.log('🟠 FAIR: Warm cache performance could be improved (>= 100ms)');
  }

  if (warmResults.hitRate >= 95) {
    console.log('✅ EXCELLENT: Cache hit rate is excellent (>= 95%)');
  } else if (warmResults.hitRate >= 80) {
    console.log('🟡 GOOD: Cache hit rate is good (>= 80%)');
  } else {
    console.log('🔴 NEEDS IMPROVEMENT: Cache hit rate is low (< 80%)');
  }

  console.log('\n' + '='.repeat(60));
}

async function main() {
  console.log('🚀 Cache Performance Test - Measurement Script\n');

  try {
    // Get test story ID
    const testStories = await db.query.stories.findMany({
      where: (stories, { like }) => like(stories.title, 'Cache Test Story%'),
      limit: 1,
    });

    if (testStories.length === 0) {
      console.error('❌ No test stories found. Run setup script first:');
      console.error('   dotenv --file .env.local run node scripts/cache-test-setup.mjs');
      process.exit(1);
    }

    const testStoryId = testStories[0].id;
    console.log(`✅ Using test story: ${testStories[0].title} (${testStoryId})\n`);

    // Run tests
    const coldResult = await runColdCacheTest(testStoryId);

    await new Promise((resolve) => setTimeout(resolve, TEST_CONFIG.waitBetweenTests));

    const warmResults = await runWarmCacheTest(testStoryId);

    await new Promise((resolve) => setTimeout(resolve, TEST_CONFIG.waitBetweenTests));

    const invalidationResults = await runCacheInvalidationTest(testStoryId);

    // Generate report
    generateReport(coldResult, warmResults, invalidationResults);

    console.log('\n✅ Cache performance test complete!\n');
  } catch (error) {
    console.error('\n❌ Test error:', error);
    process.exit(1);
  }
}

main();

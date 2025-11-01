#!/usr/bin/env node

/**
 * Test comic loading performance with optimized queries
 *
 * Tests:
 * 1. Cold load (no cache)
 * 2. Warm load (Redis cache hit)
 * 3. Database query performance
 */

import { getStoryWithComicPanels } from '../src/lib/db/comic-queries.js';
import { getCache } from '../src/lib/cache/redis-cache.js';

const STORY_ID = 'qMH4sJmFTlB6KmdR0C6Uu'; // "Unearthed Truths, Buried Doubts"

console.log('\n🎨 Comic Performance Test');
console.log('========================\n');

// Test 1: Clear cache and measure cold load
console.log('Test 1: Cold Load (no cache)');
console.log('-----------------------------');

const cache = getCache();
await cache.del(`story:${STORY_ID}:comics:public`);
console.log('✅ Cache cleared\n');

const coldStart = Date.now();
const coldResult = await getStoryWithComicPanels(STORY_ID);
const coldDuration = Date.now() - coldStart;

console.log(`⏱️  Cold load time: ${coldDuration}ms`);
console.log(`📊 Scenes loaded: ${coldResult?.parts?.[0]?.chapters?.reduce((sum, ch) => sum + (ch.scenes?.length || 0), 0) || 0}`);
console.log(`🎬 Total panels: ${coldResult?.parts?.[0]?.chapters?.reduce((sum, ch) => sum + ch.scenes?.reduce((s, sc) => s + (sc.comicPanels?.length || 0), 0), 0) || 0}`);

// Test 2: Warm load (Redis cache hit)
console.log('\n\nTest 2: Warm Load (Redis cache)');
console.log('--------------------------------');

const warmStart = Date.now();
const warmResult = await getStoryWithComicPanels(STORY_ID);
const warmDuration = Date.now() - warmStart;

console.log(`⏱️  Warm load time: ${warmDuration}ms`);
console.log(`📊 Scenes loaded: ${warmResult?.parts?.[0]?.chapters?.reduce((sum, ch) => sum + (ch.scenes?.length || 0), 0) || 0}`);
console.log(`🎬 Total panels: ${warmResult?.parts?.[0]?.chapters?.reduce((sum, ch) => sum + ch.scenes?.reduce((s, sc) => s + (sc.comicPanels?.length || 0), 0), 0) || 0}`);

// Test 3: Multiple requests to verify cache stability
console.log('\n\nTest 3: Cache Stability (5 requests)');
console.log('-------------------------------------');

const times = [];
for (let i = 0; i < 5; i++) {
  const start = Date.now();
  await getStoryWithComicPanels(STORY_ID);
  const duration = Date.now() - start;
  times.push(duration);
  console.log(`  Request ${i + 1}: ${duration}ms`);
}

const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
console.log(`  Average: ${avgTime.toFixed(2)}ms`);

// Summary
console.log('\n\n📊 Performance Summary');
console.log('======================');
console.log(`Cold load:  ${coldDuration}ms`);
console.log(`Warm load:  ${warmDuration}ms`);
console.log(`Improvement: ${((coldDuration - warmDuration) / coldDuration * 100).toFixed(1)}% faster`);
console.log(`Speedup:     ${(coldDuration / warmDuration).toFixed(1)}x`);

console.log('\n✅ Performance test complete\n');

process.exit(0);

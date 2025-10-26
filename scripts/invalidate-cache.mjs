#!/usr/bin/env node
/**
 * Invalidate Redis cache for updated scene content
 */

import { invalidateCache } from '../src/lib/cache/redis-cache.js';

const chapterId = '7o4tLylS_WQRbAkXjJtXR';
const storyId = '3JpLdcXb5hQK7zy5g3QIj';

console.log('Invalidating caches for updated scene content...');
console.log('');

const cachesToInvalidate = [
  // Chapter scenes cache (public)
  `chapter:${chapterId}:scenes:public`,

  // Chapter cache (public)
  `chapter:${chapterId}:public`,

  // Story cache (public)
  `story:${storyId}:public`,

  // Story chapters cache (public)
  `story:${storyId}:chapters:public`,
];

console.log('Cache keys to invalidate:');
cachesToInvalidate.forEach(key => console.log(`  - ${key}`));
console.log('');

try {
  await invalidateCache(cachesToInvalidate);
  console.log('✅ Cache invalidated successfully!');
  console.log('');
  console.log('The API will now fetch fresh content from the database.');
  process.exit(0);
} catch (error) {
  console.error('❌ Error invalidating cache:', error);
  process.exit(1);
}

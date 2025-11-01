import { getCache } from '../src/lib/cache/redis-cache.js';

const storyId = 'qMH4sJmFTlB6KmdR0C6Uu';

console.log(`🗑️  Invalidating cache for story: ${storyId}`);

const cache = getCache();

// Delete all cache keys for this story
const patterns = [
  `story:${storyId}:public`,
  `story:${storyId}:structure:scenes:true:public`,
  `story:${storyId}:structure:scenes:false:public`,
];

for (const key of patterns) {
  await cache.del(key);
  console.log(`✅ Deleted: ${key}`);
}

console.log('\n✅ Cache invalidated successfully!');
process.exit(0);

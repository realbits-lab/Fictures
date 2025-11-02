#!/usr/bin/env node
/**
 * Clear Redis cache for a specific story
 */

import { createClient } from 'redis';

const storyId = 'kfiNwbdYD2BAnC7IAyjps';

const client = createClient({
  url: process.env.REDIS_URL
});

console.log('\n🗑️  Clearing Redis cache for story:', storyId, '\n');

try {
  await client.connect();

  // Pattern to match all cache keys for this story
  const patterns = [
    `story:${storyId}:*`,
    `chapter:*:public`,
    `scene:*:public`,
  ];

  let totalDeleted = 0;

  for (const pattern of patterns) {
    console.log(`🔍 Scanning for keys matching: ${pattern}`);

    const keys = await client.keys(pattern);

    if (keys.length > 0) {
      console.log(`   Found ${keys.length} keys`);

      for (const key of keys) {
        await client.del(key);
        console.log(`   ✅ Deleted: ${key}`);
      }

      totalDeleted += keys.length;
    } else {
      console.log(`   No keys found`);
    }
  }

  console.log(`\n✅ Cache clear complete! Deleted ${totalDeleted} keys total.\n`);

  await client.disconnect();

} catch (error) {
  console.error('❌ Error:', error);
  await client.disconnect().catch(() => {});
  process.exit(1);
}

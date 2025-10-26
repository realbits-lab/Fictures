#!/usr/bin/env node
/**
 * Clear Redis cache for updated scene content
 */

import { createClient } from 'redis';

const chapterId = '7o4tLylS_WQRbAkXjJtXR';
const storyId = '3JpLdcXb5hQK7zy5g3QIj';

console.log('Connecting to Redis...');

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error('❌ REDIS_URL not set');
  process.exit(1);
}

const client = createClient({ url: redisUrl });

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

try {
  await client.connect();
  console.log('✅ Connected to Redis\n');

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

  console.log('Cache keys to delete:');
  cachesToInvalidate.forEach(key => console.log(`  - ${key}`));
  console.log('');

  for (const key of cachesToInvalidate) {
    const result = await client.del(key);
    console.log(`${result > 0 ? '✓' : '○'} ${key} ${result > 0 ? '(deleted)' : '(not found)'}`);
  }

  console.log('');
  console.log('✅ Cache cleared successfully!');
  console.log('The API will now fetch fresh content from the database.');

  await client.disconnect();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error);
  await client.disconnect();
  process.exit(1);
}

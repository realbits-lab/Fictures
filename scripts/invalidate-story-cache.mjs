import { createClient } from 'redis';

const storyId = 'qMH4sJmFTlB6KmdR0C6Uu';

console.log(`🗑️  Invalidating cache for story: ${storyId}`);

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error('❌ REDIS_URL not configured');
  process.exit(1);
}

const client = createClient({ url: redisUrl });

client.on('error', (err) => console.error('❌ Redis Client Error:', err));

await client.connect();
console.log('✅ Connected to Redis');

// Delete all cache keys for this story
const patterns = [
  `story:${storyId}:public`,
  `story:${storyId}:structure:scenes:true:public`,
  `story:${storyId}:structure:scenes:false:public`,
  `story:${storyId}:structure:user:*`,
];

for (const pattern of patterns) {
  if (pattern.includes('*')) {
    // Use pattern matching for wildcard keys
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      for (const key of keys) {
        await client.del(key);
        console.log(`✅ Deleted: ${key}`);
      }
    } else {
      console.log(`ℹ️  No keys found for pattern: ${pattern}`);
    }
  } else {
    const result = await client.del(pattern);
    if (result > 0) {
      console.log(`✅ Deleted: ${pattern}`);
    } else {
      console.log(`ℹ️  Key not found: ${pattern}`);
    }
  }
}

await client.disconnect();
console.log('\n✅ Cache invalidated successfully!');
process.exit(0);

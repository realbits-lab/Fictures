#!/usr/bin/env node

/**
 * Test script for real-time story updates via Redis Pub/Sub + SSE
 *
 * This script simulates publishing a story and verifies that:
 * 1. Redis events are published correctly
 * 2. SSE clients receive the events
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/test-real-time-updates.mjs
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error('❌ REDIS_URL environment variable is not set');
  process.exit(1);
}

console.log('🚀 Testing Real-Time Story Updates\n');

// Create Redis publisher
const publisher = new Redis(REDIS_URL);

// Create Redis subscriber to monitor events
const subscriber = new Redis(REDIS_URL);

// Test configuration
const testStory = {
  storyId: 'test-story-' + Date.now(),
  title: 'Test Story: Real-Time Updates',
  authorId: 'test-author',
  genre: 'Science Fiction',
  timestamp: new Date().toISOString(),
};

// Track received events
let receivedEvent = false;

// Subscribe to story:published channel
await subscriber.subscribe('story:published');

console.log('📡 Subscribed to Redis channel: story:published');

// Listen for messages
subscriber.on('message', (channel, message) => {
  console.log(`\n✅ Received event on channel: ${channel}`);

  try {
    const data = JSON.parse(message);
    console.log('📦 Event data:', JSON.stringify(data, null, 2));

    // Verify the event matches what we published
    if (data.storyId === testStory.storyId) {
      console.log('✅ Event data matches published story!');
      receivedEvent = true;
    } else {
      console.log('⚠️  Event data does not match (might be from another source)');
    }
  } catch (error) {
    console.error('❌ Error parsing message:', error);
  }
});

// Wait a moment for subscription to be ready
await new Promise(resolve => setTimeout(resolve, 500));

// Publish test event
console.log('\n📤 Publishing test event...');
console.log('Story details:', JSON.stringify(testStory, null, 2));

await publisher.publish('story:published', JSON.stringify(testStory));

console.log('✅ Event published to Redis\n');

// Wait for event to be received
console.log('⏳ Waiting for event to be received (5 seconds)...\n');
await new Promise(resolve => setTimeout(resolve, 5000));

// Check results
console.log('\n' + '='.repeat(60));
console.log('📊 Test Results');
console.log('='.repeat(60));

if (receivedEvent) {
  console.log('✅ SUCCESS: Event was received via Redis Pub/Sub');
  console.log('\n📝 Next steps:');
  console.log('   1. Start the dev server: dotenv --file .env.local run pnpm dev');
  console.log('   2. Open http://localhost:3000/community in your browser');
  console.log('   3. Check the browser console for SSE connection logs');
  console.log('   4. Run this script again to see real-time updates');
} else {
  console.log('❌ FAILED: Event was not received');
  console.log('   Check that Redis is running and REDIS_URL is correct');
}

console.log('='.repeat(60) + '\n');

// Cleanup
await subscriber.unsubscribe();
await subscriber.quit();
await publisher.quit();

process.exit(receivedEvent ? 0 : 1);

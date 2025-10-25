#!/usr/bin/env node

/**
 * Test Story Image Generation with 16:9 Ratio
 *
 * This script tests the story image generation with DALL-E 3 at 1792x1024 (16:9)
 */

import { config } from 'dotenv';
import { generateImage } from '../src/lib/ai/image-generator.js';

// Load environment variables
config({ path: '.env.local' });

const testStoryId = 'test-story-' + Date.now();
const testPrompt = 'A heartwarming story about two dogs who become best friends: Adventure, Friendship. Two dogs from different backgrounds meeting at a park and forming an unlikely bond. Themes of friendship, loyalty, and acceptance.';

console.log('🎨 Testing Story Image Generation with 16:9 Ratio\n');
console.log('Story ID:', testStoryId);
console.log('Prompt:', testPrompt.substring(0, 100) + '...\n');

try {
  const result = await generateImage(
    testPrompt,
    'story',
    testStoryId,
    {
      style: 'fantasy-art',
      aspectRatio: 'landscape',
      quality: 'high',
      mood: 'epic and dramatic',
      lighting: 'cinematic'
    }
  );

  console.log('\n✅ Image Generation Result:');
  console.log('Success:', result.success);
  console.log('Method:', result.method);
  console.log('Style:', result.style);
  console.log('Image URL:', result.imageUrl);

  if (result.method === 'dall-e-3-resized') {
    console.log('\n✅ Image generated with DALL-E 3 at 1792x1024 and resized to 640x360 (16:9 ratio)');
  } else if (result.method === 'placeholder') {
    console.log('\n⚠️ Placeholder image used. This may indicate an API issue.');
  }

  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

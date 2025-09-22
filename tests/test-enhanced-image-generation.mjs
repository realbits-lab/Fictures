#!/usr/bin/env node

/**
 * Test script for enhanced image generation with AI Gateway integration
 * Tests the new provider fallback chain: OpenAI DALL-E → Gemini → Placeholder
 */

import 'dotenv/config';

const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function testImageGeneration() {
  console.log('🧪 Testing Enhanced Image Generation with AI Gateway');
  console.log('==================================================');

  const testPrompts = [
    {
      type: 'character',
      prompt: 'A brilliant quantum physicist with silver hair and blue eyes, wearing a lab coat',
      storyId: 'test-story-' + Date.now()
    },
    {
      type: 'place',
      prompt: 'A high-tech laboratory filled with quantum equipment and glowing screens',
      storyId: 'test-story-' + Date.now()
    }
  ];

  for (const testCase of testPrompts) {
    console.log(`\n🎨 Testing ${testCase.type} image generation...`);
    console.log(`📝 Prompt: ${testCase.prompt}`);

    try {
      const startTime = Date.now();

      const response = await fetch(`${NEXTAUTH_URL}/api/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testCase.prompt,
          type: testCase.type,
          storyId: testCase.storyId,
          internal: true
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Success! Generated ${testCase.type} image in ${duration}ms`);
        console.log(`🔧 Method: ${result.method}`);
        console.log(`🖼️ Image URL: ${result.imageUrl}`);
        console.log(`💬 Response: ${result.modelResponse?.substring(0, 100)}...`);
      } else {
        const error = await response.text();
        console.log(`❌ Failed with status ${response.status}: ${error}`);
      }
    } catch (error) {
      console.error(`❌ Error testing ${testCase.type} generation:`, error.message);
    }
  }

  console.log('\n🏁 Image generation testing completed!');
}

// Check if AI Gateway API key is configured
if (!process.env.AI_GATEWAY_API_KEY) {
  console.warn('⚠️ AI_GATEWAY_API_KEY not found in environment');
  console.log('💡 The system will fall back to direct Gemini or placeholder images');
}

testImageGeneration().catch(console.error);
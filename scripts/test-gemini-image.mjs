#!/usr/bin/env node

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testGeminiImageGeneration() {
  try {
    console.log('🎨 Testing Gemini Image Generation\n');
    console.log('=====================================\n');

    const testCases = [
      {
        prompt: 'A wise elderly wizard with a long silver beard, wearing deep blue robes with golden stars, holding an ancient glowing staff',
        type: 'character',
        name: 'Wizard Character'
      },
      {
        prompt: 'A mystical forest with bioluminescent mushrooms, ancient trees with twisted roots, fog rolling through, magical particles in the air',
        type: 'place',
        name: 'Enchanted Forest'
      },
      {
        prompt: 'A dramatic scene of a dragon breathing fire over a medieval castle at sunset, knights defending the walls',
        type: 'scene',
        name: 'Dragon Attack Scene'
      }
    ];

    for (const test of testCases) {
      console.log(`\n📸 Test: ${test.name}`);
      console.log('='.repeat(50));
      console.log(`Type: ${test.type}`);
      console.log(`Prompt: ${test.prompt}\n`);

      const startTime = Date.now();

      try {
        const response = await fetch('http://localhost:3000/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'fic_g3Nmd7FfNoDS_g3Nmd7FfNoDSCuEV3e3QhhE6yu9mRML3Gm-bGcwBA2A'
          },
          body: JSON.stringify({
            prompt: test.prompt,
            type: test.type,
            storyId: 'test-gemini-' + Date.now(),
            internal: false
          })
        });

        const responseTime = Date.now() - startTime;
        const result = await response.json();

        if (response.ok && result.success) {
          console.log('✅ SUCCESS!');
          console.log(`⏱️  Response Time: ${responseTime}ms`);
          console.log(`📍 Method: ${result.method}`);
          console.log(`🔗 Image URL: ${result.imageUrl}`);

          if (result.modelResponse) {
            console.log(`📝 Model Response: ${result.modelResponse.substring(0, 200)}...`);
          }

          // Check if it's actually using Gemini or falling back
          if (result.method.includes('placeholder')) {
            console.log('\n⚠️  WARNING: Fell back to placeholder!');
            console.log(`   Reason: ${result.method}`);
          } else if (result.method.includes('gemini')) {
            console.log('\n🎯 Gemini generation successful!');
          }
        } else {
          console.log('❌ FAILED!');
          console.log(`   Status: ${response.status}`);
          console.log(`   Error: ${result.error || 'Unknown error'}`);
          console.log(`   Details: ${result.details || 'No details provided'}`);
        }
      } catch (error) {
        console.error('❌ Request Error:', error.message);
        console.error('   Stack:', error.stack);
      }
    }

    // Test with internal flag to see if behavior changes
    console.log('\n\n🔧 Testing with internal=true flag');
    console.log('='.repeat(50));

    try {
      const response = await fetch('http://localhost:3000/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'Test prompt for internal call',
          type: 'character',
          storyId: 'test-internal',
          internal: true
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Internal call succeeded');
        console.log(`   Method: ${result.method}`);
      } else {
        console.log('❌ Internal call failed');
        console.log(`   Error: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Internal call error:', error.message);
    }

    // Check environment variables
    console.log('\n\n🔑 Environment Check');
    console.log('='.repeat(50));
    console.log(`GOOGLE_GENERATIVE_AI_API_KEY exists: ${!!process.env.GOOGLE_GENERATIVE_AI_API_KEY}`);
    console.log(`AI_GATEWAY_API_KEY exists: ${!!process.env.AI_GATEWAY_API_KEY}`);
    console.log(`BLOB_READ_WRITE_TOKEN exists: ${!!process.env.BLOB_READ_WRITE_TOKEN}`);

    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.log(`Google API Key prefix: ${process.env.GOOGLE_GENERATIVE_AI_API_KEY.substring(0, 10)}...`);
    } else {
      console.log('⚠️  No Google Generative AI API key found!');
      console.log('   This is likely why Gemini image generation is failing.');
      console.log('   The app needs GOOGLE_GENERATIVE_AI_API_KEY in .env.local');
    }

    console.log('\n✅ Test completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
}

testGeminiImageGeneration();
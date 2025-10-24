#!/usr/bin/env node

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testDalleGeneration() {
  try {
    console.log('🎨 Testing DALL-E image generation...\n');

    const testPrompts = [
      {
        prompt: 'A mystical librarian with silver hair and glowing blue eyes, wearing ancient robes',
        type: 'character',
        name: 'Test Character'
      },
      {
        prompt: 'A magical library with floating books and ethereal light streaming through stained glass windows',
        type: 'place',
        name: 'Test Setting'
      }
    ];

    for (const test of testPrompts) {
      console.log(`\n📸 Generating ${test.type}: ${test.name}`);
      console.log(`Prompt: ${test.prompt}`);

      try {
        const response = await fetch('http://localhost:3000/api/generate-image-v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'fic_g3Nmd7FfNoDS_g3Nmd7FfNoDSCuEV3e3QhhE6yu9mRML3Gm-bGcwBA2A'
          },
          body: JSON.stringify({
            prompt: test.prompt,
            type: test.type,
            storyId: 'DvivaQJdvv8hekcrK93Pe',
            internal: false
          })
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ Success!');
          console.log(`   Method: ${result.method}`);
          console.log(`   URL: ${result.imageUrl}`);
          console.log(`   Response: ${result.modelResponse}`);
        } else {
          console.log('❌ Failed:', result.error);
          console.log(`   Details: ${result.details}`);
        }
      } catch (error) {
        console.error('❌ Request error:', error.message);
      }
    }

    console.log('\n✅ Test completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testDalleGeneration();
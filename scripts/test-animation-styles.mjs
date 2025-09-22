#!/usr/bin/env node

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const API_URL = 'http://localhost:3000/api/generate-image';

// Test different animation styles
const testCases = [
  {
    prompt: "A brave knight with shining armor and a magical sword",
    type: "character",
    style: "anime",
    description: "Anime style character"
  },
  {
    prompt: "A whimsical forest with giant mushrooms and glowing fireflies",
    type: "setting",
    style: "studio-ghibli",
    description: "Studio Ghibli style setting"
  },
  {
    prompt: "A friendly dragon playing with children in a meadow",
    type: "scene",
    style: "pixar",
    description: "Pixar style scene"
  },
  {
    prompt: "A mysterious wizard casting a spell",
    type: "character",
    style: "comic-book",
    description: "Comic book style character"
  },
  {
    prompt: "An enchanted castle floating in the clouds",
    type: "setting",
    style: "watercolor",
    description: "Watercolor style setting"
  },
  {
    prompt: "A robot exploring an ancient temple",
    type: "scene",
    style: "pixel-art",
    description: "Pixel art style scene"
  }
];

async function testImageGeneration() {
  console.log('🎨 Testing Animation Style Image Generation\n');
  console.log('=' .repeat(50));

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.description}`);
    console.log(`   Prompt: "${testCase.prompt}"`);
    console.log(`   Type: ${testCase.type}`);
    console.log(`   Style: ${testCase.style}`);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: testCase.prompt,
          type: testCase.type,
          storyId: 'test-story-123',
          style: testCase.style,
          quality: 'high',
          aspectRatio: testCase.type === 'character' ? 'portrait' : 'landscape',
          mood: 'adventurous',
          internal: true // Skip auth for testing
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`   ✅ Success!`);
        console.log(`   🖼️  Image URL: ${result.imageUrl}`);
        console.log(`   🔧 Method: ${result.method}`);
        console.log(`   🎨 Applied Style: ${result.style || 'default'}`);
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('✨ Testing complete!\n');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET',
      timeout: 2000
    }).catch(() => null);

    if (!response) {
      console.log('⚠️  Server not running on port 3000');
      console.log('💡 Start the server with: dotenv --file .env.local run pnpm dev');
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🚀 Animation Style Image Generation Test\n');

  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('\n❌ Please start the development server first');
    process.exit(1);
  }

  await testImageGeneration();
}

main().catch(console.error);
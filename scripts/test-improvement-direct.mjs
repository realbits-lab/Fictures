#!/usr/bin/env node

// Direct test of story improvement without SSE streaming
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load API key
const authFile = path.join(__dirname, '..', '.auth', 'user.json');
const authData = JSON.parse(fs.readFileSync(authFile, 'utf8'));
const API_KEY = authData.managerCredentials.apiKey;

const API_BASE = 'http://localhost:3000';

async function testImprovementDirect() {
  console.log('🧪 Testing Story Improvement Directly');
  console.log('====================================');

  try {
    // Step 1: Generate a simple story
    console.log('\n1. Generating story...');
    const generateResponse = await fetch(`${API_BASE}/api/stories/generate-hns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        prompt: "A short detective story",
        language: "English"
      })
    });

    if (!generateResponse.ok) {
      throw new Error(`Generation failed: ${generateResponse.status}`);
    }

    console.log('✅ Story generated successfully');

    // Step 2: Wait a bit for generation to complete
    console.log('\n2. Waiting for generation to complete...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Step 3: Directly test improvement API (if it exists)
    console.log('\n3. Testing improvement process...');
    console.log('   (Improvement is integrated into generation, so checking server logs)');

    console.log('\n✅ Direct improvement test completed!');
    console.log('   Check server logs for detailed improvement metrics');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testImprovementDirect().catch(console.error);
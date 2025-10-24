#!/usr/bin/env node

// Test the enableQualityImprovement flag functionality
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

async function testQualityFlag() {
  console.log('🎭 Testing Quality Improvement Flag');
  console.log('===================================');

  try {
    // Test 1: Without quality improvement (default)
    console.log('\n📍 TEST 1: Default behavior (enableQualityImprovement = false)');
    console.log('──────────────────────────────────────────────────────────');

    const response1 = await fetch(`${API_BASE}/api/stories/generate-hns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        prompt: "A simple test story",
        language: "English"
        // enableQualityImprovement not specified - should default to false
      })
    });

    if (!response1.ok) {
      throw new Error(`Test 1 failed: ${response1.status}`);
    }

    console.log('✅ Test 1 started successfully');
    console.log('   Expected: No quality analysis phase should appear in SSE stream');

    // Test 2: With quality improvement enabled
    console.log('\n📍 TEST 2: With quality improvement enabled');
    console.log('────────────────────────────────────────────');

    await new Promise(resolve => setTimeout(resolve, 2000)); // Small delay between tests

    const response2 = await fetch(`${API_BASE}/api/stories/generate-hns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        prompt: "A simple test story for improvement",
        language: "English",
        enableQualityImprovement: true
      })
    });

    if (!response2.ok) {
      throw new Error(`Test 2 failed: ${response2.status}`);
    }

    console.log('✅ Test 2 started successfully');
    console.log('   Expected: Quality analysis and improvement phases should appear');

    console.log('\n🎯 TESTING COMPLETED');
    console.log('==================');
    console.log('Both tests initiated successfully!');
    console.log('Check the server logs to verify:');
    console.log('  - Test 1: Should skip quality improvement section');
    console.log('  - Test 2: Should include quality analysis and improvement');
    console.log('');
    console.log('Monitor both tests for completion in server logs.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testQualityFlag().catch(console.error);
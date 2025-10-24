#!/usr/bin/env node

// Generate a fresh new story - library adventure theme
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

async function generateFreshStory() {
  console.log('📚 Fresh Story Generation - Library Adventure');
  console.log('============================================');

  try {
    console.log('\n🔮 Story Theme: Ancient Library Mystery');
    console.log('Prompt: A scholar discovers an ancient library hidden beneath the city, filled with magical books that hold the key to forgotten knowledge and dangerous secrets.');
    console.log('════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════');

    const response = await fetch(`${API_BASE}/api/stories/generate-hns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        prompt: "A scholar discovers an ancient library hidden beneath the city, filled with magical books that hold the key to forgotten knowledge and dangerous secrets.",
        language: "English",
        enableQualityImprovement: false // Fast generation without improvement
      })
    });

    if (!response.ok) {
      throw new Error(`Story generation failed: ${response.status}`);
    }

    console.log('\n✅ Fresh story generation started successfully!');
    console.log('\n📊 Generation Details:');
    console.log('   🎭 Genre: Fantasy Adventure');
    console.log('   📍 Setting: Ancient Underground Library');
    console.log('   ⚡ Quality Improvement: Disabled (faster generation)');
    console.log('   ⏱️  Expected Duration: 2-4 minutes');
    console.log('');
    console.log('📈 Track Progress in Server Logs:');
    console.log('   tail -f logs/dev-server.log');
    console.log('');
    console.log('🎯 This will be your fresh new story!');

  } catch (error) {
    console.error('\n❌ Story generation failed:', error.message);
    process.exit(1);
  }
}

generateFreshStory().catch(console.error);
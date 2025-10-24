#!/usr/bin/env node

// Test HNS data cleaning - verify no phase data is stored in database
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

async function testHnsDataCleaning() {
  console.log('🧪 Testing HNS Data Cleaning');
  console.log('=============================');

  try {
    // Skip cleanup and test with existing/new data
    console.log('\n📋 Testing with current database state...');

    // Generate a simple test story
    console.log('\n📖 Generating test story...');
    const storyResponse = await fetch(`${API_BASE}/api/stories/generate-hns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        prompt: "A detective investigates a mysterious case in a small town.",
        language: "English",
        enableQualityImprovement: false // Fast generation for testing
      })
    });

    if (!storyResponse.ok) {
      throw new Error(`Story generation failed: ${storyResponse.status}`);
    }

    console.log('✅ Story generation started');

    // Wait a bit for generation to complete
    console.log('\n⏳ Waiting for story generation to complete...');
    await new Promise(resolve => setTimeout(resolve, 120000)); // 2 minutes

    // Now fetch and inspect the generated story data
    console.log('\n🔍 Inspecting generated story data...');
    const storiesResponse = await fetch(`${API_BASE}/api/stories`, {
      headers: {
        'x-api-key': API_KEY
      }
    });

    if (!storiesResponse.ok) {
      throw new Error(`Failed to fetch stories: ${storiesResponse.status}`);
    }

    const stories = await storiesResponse.json();
    console.log(`📊 Found ${stories.length} stories`);

    if (stories.length === 0) {
      console.log('⚠️  No stories found - generation may still be in progress');
      return;
    }

    // Inspect the story hnsData
    const story = stories[0];
    console.log('\n🔎 Inspecting story hnsData:');
    console.log('Story ID:', story.id);
    console.log('Story Title:', story.title);

    if (story.hnsData) {
      const hnsData = typeof story.hnsData === 'string' ? JSON.parse(story.hnsData) : story.hnsData;

      // Check for prohibited phase keys
      const phaseKeys = [
        'phase1_story',
        'phase2_parts',
        'phase3_characters',
        'phase4_settings',
        'phase5_6_data',
        'phase7_content',
        'phases'
      ];

      const foundPhaseKeys = [];
      function checkForPhaseKeys(obj, path = '') {
        if (obj && typeof obj === 'object') {
          for (const [key, value] of Object.entries(obj)) {
            const fullPath = path ? `${path}.${key}` : key;
            if (phaseKeys.includes(key)) {
              foundPhaseKeys.push(fullPath);
            }
            if (typeof value === 'object' && value !== null) {
              checkForPhaseKeys(value, fullPath);
            }
          }
        }
      }

      checkForPhaseKeys(hnsData);

      if (foundPhaseKeys.length > 0) {
        console.log('❌ FAILED: Found prohibited phase keys in hnsData:');
        foundPhaseKeys.forEach(key => console.log(`   - ${key}`));
      } else {
        console.log('✅ SUCCESS: No phase keys found in story hnsData');
      }

      console.log('\n📋 Story hnsData structure:');
      console.log('Top-level keys:', Object.keys(hnsData));

      if (hnsData.metadata) {
        console.log('Metadata keys:', Object.keys(hnsData.metadata));
      }
    } else {
      console.log('⚠️  No hnsData found in story');
    }

    // Check parts if any
    if (story.parts && story.parts.length > 0) {
      console.log('\n🔎 Inspecting parts hnsData:');
      for (const part of story.parts) {
        if (part.hnsData) {
          const hnsData = typeof part.hnsData === 'string' ? JSON.parse(part.hnsData) : part.hnsData;
          const phaseKeys = Object.keys(hnsData).filter(key =>
            key.includes('phase') || ['story_id', 'part_id', 'id'].includes(key)
          );

          if (phaseKeys.length > 0) {
            console.log(`❌ FAILED: Part ${part.id} has prohibited keys: ${phaseKeys.join(', ')}`);
          } else {
            console.log(`✅ SUCCESS: Part ${part.id} hnsData is clean`);
          }
        }
      }
    }

    // Check characters if any
    if (story.characters && story.characters.length > 0) {
      console.log('\n🔎 Inspecting characters hnsData:');
      for (const character of story.characters) {
        if (character.hnsData) {
          const hnsData = typeof character.hnsData === 'string' ? JSON.parse(character.hnsData) : character.hnsData;
          const phaseKeys = Object.keys(hnsData).filter(key =>
            key.includes('phase') || ['story_id', 'character_id', 'id'].includes(key)
          );

          if (phaseKeys.length > 0) {
            console.log(`❌ FAILED: Character ${character.id} has prohibited keys: ${phaseKeys.join(', ')}`);
          } else {
            console.log(`✅ SUCCESS: Character ${character.id} hnsData is clean`);
          }
        }
      }
    }

    console.log('\n🎯 HNS Data Cleaning Test Complete');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testHnsDataCleaning().catch(console.error);
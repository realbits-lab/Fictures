#!/usr/bin/env node

// Check existing stories and their hnsData
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

async function checkExistingStories() {
  console.log('🔍 Checking Existing Stories HNS Data');
  console.log('=====================================');

  try {
    // Fetch existing stories
    console.log('\n📊 Fetching existing stories...');
    const storiesResponse = await fetch(`${API_BASE}/api/stories`, {
      headers: {
        'x-api-key': API_KEY
      }
    });

    if (!storiesResponse.ok) {
      throw new Error(`Failed to fetch stories: ${storiesResponse.status}`);
    }

    const response = await storiesResponse.json();
    const stories = response.stories || [];
    console.log(`Found ${stories.length} stories in database`);

    if (stories.length === 0) {
      console.log('⚠️  No stories found in database');
      return;
    }

    // Check each story for phase data contamination
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      console.log(`\n🔎 Inspecting Story ${i + 1}/${stories.length}:`);
      console.log(`   ID: ${story.id}`);
      console.log(`   Title: ${story.title || 'Untitled'}`);
      console.log(`   Status: ${story.status || 'unknown'}`);

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
          console.log('   ❌ CONTAMINATED: Found prohibited phase keys:');
          foundPhaseKeys.forEach(key => console.log(`      - ${key}`));
        } else {
          console.log('   ✅ CLEAN: No phase keys found in hnsData');
        }

        console.log(`   📋 Top-level keys: ${Object.keys(hnsData).join(', ')}`);

        if (hnsData.metadata) {
          console.log(`   🏷️  Metadata keys: ${Object.keys(hnsData.metadata).join(', ')}`);
        }
      } else {
        console.log('   ⚠️  No hnsData found');
      }

      // Check parts
      if (story.parts && story.parts.length > 0) {
        console.log(`   📚 Checking ${story.parts.length} parts...`);
        for (const part of story.parts) {
          if (part.hnsData) {
            const hnsData = typeof part.hnsData === 'string' ? JSON.parse(part.hnsData) : part.hnsData;
            const contaminatedKeys = Object.keys(hnsData).filter(key =>
              key.includes('phase') || ['story_id', 'part_id', 'id'].includes(key)
            );

            if (contaminatedKeys.length > 0) {
              console.log(`      ❌ Part ${part.id}: contaminated with ${contaminatedKeys.join(', ')}`);
            } else {
              console.log(`      ✅ Part ${part.id}: clean`);
            }
          }
        }
      }

      // Check characters
      if (story.characters && story.characters.length > 0) {
        console.log(`   👥 Checking ${story.characters.length} characters...`);
        for (const character of story.characters) {
          if (character.hnsData) {
            const hnsData = typeof character.hnsData === 'string' ? JSON.parse(character.hnsData) : character.hnsData;
            const contaminatedKeys = Object.keys(hnsData).filter(key =>
              key.includes('phase') || ['story_id', 'character_id', 'id'].includes(key)
            );

            if (contaminatedKeys.length > 0) {
              console.log(`      ❌ Character ${character.id}: contaminated with ${contaminatedKeys.join(', ')}`);
            } else {
              console.log(`      ✅ Character ${character.id}: clean`);
            }
          }
        }
      }
    }

    console.log('\n🎯 Story Data Inspection Complete');

  } catch (error) {
    console.error('\n❌ Check failed:', error.message);
    process.exit(1);
  }
}

checkExistingStories().catch(console.error);
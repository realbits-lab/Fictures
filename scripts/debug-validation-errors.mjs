#!/usr/bin/env node

// Debug script to show actual validation errors
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

async function debugValidationErrors() {
  console.log('🔍 Debugging Validation Errors');
  console.log('==============================');

  try {
    // Call the validation API directly to see errors
    console.log('\n1. Calling story-analysis API to see validation details...');

    const response = await fetch(`${API_BASE}/api/stories/story-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        storyId: "h3EcMOj7DrqXinZ-ybkX4" // Use the latest story ID from our test
      })
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.status}`);
    }

    const result = await response.json();

    console.log('\n📊 VALIDATION BREAKDOWN:');
    console.log('=========================');

    if (result.validation) {
      console.log(`Total Errors: ${result.validation.totalErrors}`);
      console.log(`Total Warnings: ${result.validation.totalWarnings}`);

      // Show story errors
      if (result.validation.story?.errors?.length > 0) {
        console.log('\n🏗️ STORY ERRORS:');
        result.validation.story.errors.forEach((error, i) => {
          console.log(`  ${i + 1}. ${error.message} (${error.path})`);
        });
      }

      // Show parts errors
      if (result.validation.parts) {
        result.validation.parts.forEach((part, i) => {
          if (part.errors?.length > 0) {
            console.log(`\n📚 PART ${i + 1} ERRORS:`);
            part.errors.forEach((error, j) => {
              console.log(`  ${j + 1}. ${error.message} (${error.path})`);
            });
          }
        });
      }

      // Show chapters errors
      if (result.validation.chapters) {
        result.validation.chapters.forEach((chapter, i) => {
          if (chapter.errors?.length > 0) {
            console.log(`\n📖 CHAPTER ${i + 1} ERRORS:`);
            chapter.errors.forEach((error, j) => {
              console.log(`  ${j + 1}. ${error.message} (${error.path})`);
            });
          }
        });
      }

      // Show scenes errors
      if (result.validation.scenes) {
        result.validation.scenes.forEach((scene, i) => {
          if (scene.errors?.length > 0) {
            console.log(`\n🎬 SCENE ${i + 1} ERRORS:`);
            scene.errors.forEach((error, j) => {
              console.log(`  ${j + 1}. ${error.message} (${error.path})`);
            });
          }
        });
      }

      // Show characters errors
      if (result.validation.characters) {
        result.validation.characters.forEach((char, i) => {
          if (char.errors?.length > 0) {
            console.log(`\n👥 CHARACTER ${i + 1} ERRORS:`);
            char.errors.forEach((error, j) => {
              console.log(`  ${j + 1}. ${error.message} (${error.path})`);
            });
          }
        });
      }

      // Show settings errors
      if (result.validation.settings) {
        result.validation.settings.forEach((setting, i) => {
          if (setting.errors?.length > 0) {
            console.log(`\n🏙️ SETTING ${i + 1} ERRORS:`);
            setting.errors.forEach((error, j) => {
              console.log(`  ${j + 1}. ${error.message} (${error.path})`);
            });
          }
        });
      }
    }

    console.log('\n✅ Validation error analysis complete!');

  } catch (error) {
    console.error('\n❌ Debug failed:', error.message);
    process.exit(1);
  }
}

debugValidationErrors().catch(console.error);
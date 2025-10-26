#!/usr/bin/env node

/**
 * Find "The Glitch in the Machine" Scene
 *
 * Quick diagnostic script to search for the scene in the database
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const AUTH_FILE_PATH = join(__dirname, '../.auth/user.json');
const authData = JSON.parse(readFileSync(AUTH_FILE_PATH, 'utf-8'));
const profile = authData.profiles?.[authData.defaultProfile] || authData.profiles?.manager;
const authCookies = profile.cookies.map(c => `${c.name}=${c.value}`).join('; ');

const BASE_URL = 'http://localhost:3000';

async function findScenes() {
  console.log('\n🔍 Searching for scenes with "Glitch" or "Digital Ghost"...\n');

  try {
    // Get all stories
    const response = await fetch(`${BASE_URL}/api/stories`, {
      headers: { 'Cookie': authCookies }
    });

    const data = await response.json();
    const stories = data.stories || [];

    console.log(`Found ${stories.length} total stories\n`);

    // Search through each story
    for (const story of stories) {
      console.log(`📚 Story: "${story.title}" (ID: ${story.id})`);

      const storyResponse = await fetch(`${BASE_URL}/api/stories/${story.id}`, {
        headers: { 'Cookie': authCookies }
      });

      const storyData = await storyResponse.json();

      if (storyData.chapters) {
        for (const chapter of storyData.chapters) {
          if (chapter.scenes) {
            for (const scene of chapter.scenes) {
              const title = scene.title || '';
              const lowerTitle = title.toLowerCase();

              // Look for "glitch" or "digital ghost" scenes
              if (lowerTitle.includes('glitch') || lowerTitle.includes('digital')) {
                console.log(`  ✅ FOUND: "${scene.title}"`);
                console.log(`     Scene ID: ${scene.id}`);
                console.log(`     Chapter: ${chapter.title}`);
                console.log(`     Content length: ${scene.content?.length || 0} chars`);
                console.log('');
              }
            }
          }
        }
      }
    }

    console.log('\n✅ Search complete');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findScenes();

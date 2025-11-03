#!/usr/bin/env node

/**
 * Publish Story Script (Manager Account)
 *
 * Changes story status from 'writing' to 'published'
 * Uses manager@fictures.xyz credentials from .auth/manager.json
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/publish-story-manager.mjs STORY_ID
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const managerJsonPath = join(__dirname, '..', '.auth', 'manager.json');

// Load manager credentials
let USER_COOKIES;
let USER_EMAIL;
try {
  const managerData = JSON.parse(readFileSync(managerJsonPath, 'utf8'));
  USER_COOKIES = managerData.cookies;
  USER_EMAIL = managerData.email;

  if (!USER_COOKIES || USER_COOKIES.length === 0) {
    throw new Error('No cookies found in .auth/manager.json');
  }
} catch (error) {
  console.error('❌ Error loading manager credentials:', error.message);
  console.error('   Ensure .auth/manager.json exists with valid session cookies');
  process.exit(1);
}

function cookiesToString(cookies) {
  return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

const apiUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
const cookieString = cookiesToString(USER_COOKIES);

// Get story ID from command line
const storyId = process.argv[2];

if (!storyId) {
  console.error('❌ Error: Story ID is required');
  console.error('Usage: node scripts/publish-story-manager.mjs STORY_ID');
  process.exit(1);
}

console.log(`📤 Publishing story: ${storyId}`);
console.log(`👤 Account: ${USER_EMAIL}\n`);

async function publishStory() {
  try {
    // Update story status to 'published'
    const response = await fetch(`${apiUrl}/api/stories/${storyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString
      },
      body: JSON.stringify({
        status: 'published',
        visibility: 'public'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to publish story: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    console.log('✅ Story published successfully!\n');
    console.log('📖 Story Details:');
    console.log(`   Title: ${result.story.title}`);
    console.log(`   Status: ${result.story.status}`);
    console.log(`   Visibility: ${result.story.visibility}`);
    console.log('');
    console.log('🔗 View Story:');
    console.log(`   Novel: ${apiUrl}/novels/${storyId}`);
    console.log(`   Comic: ${apiUrl}/comics/${storyId}`);
    console.log(`   Community: ${apiUrl}/community/story/${storyId}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

publishStory();

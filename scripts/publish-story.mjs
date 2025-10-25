#!/usr/bin/env node

/**
 * Publish Story Script
 * Updates a story status from 'writing' to 'published'
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load authentication
async function loadAuth() {
  const authPath = path.join(__dirname, '../.auth/user.json');
  try {
    const authData = await fs.readFile(authPath, 'utf-8');
    const auth = JSON.parse(authData);

    const profileName = auth.defaultProfile || 'manager';
    const profile = auth.profiles?.[profileName];

    if (!profile) {
      throw new Error(`Profile "${profileName}" not found in .auth/user.json`);
    }

    const sessionCookie = profile.cookies?.find(c =>
      c.name === 'authjs.session-token' || c.name === '__Secure-authjs.session-token'
    );

    if (!sessionCookie) {
      throw new Error('No session cookie found in .auth/user.json');
    }

    return sessionCookie.value;
  } catch (error) {
    console.error('❌ Failed to load authentication:', error.message);
    throw error;
  }
}

// Publish story
async function publishStory(storyId, sessionToken) {
  const url = `http://localhost:3000/api/stories/${storyId}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Cookie': `authjs.session-token=${sessionToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'published'
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to publish story: ${error}`);
  }

  return await response.json();
}

// Main execution
async function main() {
  const storyId = process.argv[2];

  if (!storyId) {
    console.error('❌ Usage: node scripts/publish-story.mjs STORY_ID');
    process.exit(1);
  }

  try {
    console.log('🔐 Loading authentication...');
    const sessionToken = await loadAuth();

    console.log(`📤 Publishing story: ${storyId}...`);
    const story = await publishStory(storyId, sessionToken);

    console.log('\n✅ Story published successfully!\n');
    console.log(`📖 Title: ${story.title}`);
    console.log(`🆔 ID: ${story.id}`);
    console.log(`📊 Status: ${story.status}`);
    console.log(`\n🔗 View at: http://localhost:3000/community/story/${story.id}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

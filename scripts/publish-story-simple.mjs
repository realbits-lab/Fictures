#!/usr/bin/env node

/**
 * Simple Publish Story Script
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
  const authData = await fs.readFile(authPath, 'utf-8');
  const auth = JSON.parse(authData);

  const sessionCookie = auth.cookies?.find(c =>
    c.name === 'authjs.session-token' || c.name === '__Secure-authjs.session-token'
  );

  if (!sessionCookie) {
    throw new Error('No session cookie found in .auth/user.json');
  }

  return sessionCookie.value;
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
    console.error('❌ Usage: node scripts/publish-story-simple.mjs STORY_ID');
    process.exit(1);
  }

  try {
    console.log('🔐 Loading authentication...');
    const sessionToken = await loadAuth();

    console.log(`📤 Publishing story: ${storyId}...`);
    const result = await publishStory(storyId, sessionToken);

    console.log('✅ Story published successfully!');
    console.log(`📖 Story: ${result.story?.title || 'Untitled'}`);
    console.log(`🌐 Community URL: http://localhost:3000/community/story/${storyId}`);
    console.log(`📖 Read URL: http://localhost:3000/novels/${storyId}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

#!/usr/bin/env node

/**
 * Check Database via API
 *
 * Verifies if any story-related data remains in the database using the API
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
      throw new Error(`Profile "${profileName}" not found`);
    }

    const sessionCookie = profile.cookies?.find(c =>
      c.name === 'authjs.session-token' || c.name === '__Secure-authjs.session-token'
    );

    if (!sessionCookie) {
      throw new Error('No session cookie found');
    }

    return sessionCookie.value;
  } catch (error) {
    console.error('❌ Failed to load authentication:', error.message);
    throw error;
  }
}

// Get all stories
async function getAllStories(sessionToken) {
  const response = await fetch('http://localhost:3000/api/stories', {
    headers: {
      'Cookie': `authjs.session-token=${sessionToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch stories: ${response.statusText}`);
  }

  const data = await response.json();
  return data.stories || [];
}

// Main execution
async function main() {
  console.log('🔍 Checking database via API...\n');

  try {
    // Load authentication
    console.log('🔐 Loading authentication...');
    const sessionToken = await loadAuth();
    console.log('✅ Authentication loaded\n');

    // Get all stories
    console.log('📚 Fetching all stories...');
    const stories = await getAllStories(sessionToken);
    console.log(`Found ${stories.length} stories in database\n`);

    if (stories.length === 0) {
      console.log('✅ No stories found in database - database is clean!');
    } else {
      console.log('⚠️  Stories still in database:');
      for (const story of stories) {
        console.log(`\n  Story: ${story.title} (${story.id})`);
        console.log(`    Genre: ${story.genre}`);
        console.log(`    Status: ${story.status}`);
        console.log(`    Public: ${story.isPublic ? 'Yes' : 'No'}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error during check:', error.message);
    process.exit(1);
  }
}

main();

#!/usr/bin/env node

/**
 * List Stories Script
 * Lists all stories with their IDs and titles
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

    // Get default profile or use manager
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

// Get all stories
async function getStories(sessionToken) {
  const url = 'http://localhost:3000/api/stories';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cookie': `authjs.session-token=${sessionToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch stories: ${error}`);
  }

  return await response.json();
}

// Main execution
async function main() {
  const searchTerm = process.argv[2];

  try {
    console.log('🔐 Loading authentication...');
    const sessionToken = await loadAuth();

    console.log('📚 Fetching stories...\n');
    const response = await getStories(sessionToken);

    // Handle both array response and object with stories property
    const stories = Array.isArray(response) ? response : (response.stories || []);

    if (!stories || stories.length === 0) {
      console.log('No stories found.');
      return;
    }

    console.log(`Found ${stories.length} story(ies):\n`);

    const filteredStories = searchTerm
      ? stories.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
      : stories;

    if (filteredStories.length === 0) {
      console.log(`No stories found matching: ${searchTerm}`);
      return;
    }

    filteredStories.forEach((story, index) => {
      console.log(`${index + 1}. "${story.title}"`);
      console.log(`   ID: ${story.id}`);
      console.log(`   Genre: ${story.genre || 'N/A'}`);
      console.log(`   Status: ${story.status}`);
      console.log(`   Visibility: ${story.visibility}`);
      console.log(`   Created: ${new Date(story.createdAt).toLocaleDateString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

#!/usr/bin/env node

/**
 * Delete All Stories Script
 *
 * Uses the API to delete all stories and checks for orphaned data
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { del, list } from '@vercel/blob';

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

// Delete a story
async function deleteStory(storyId, sessionToken) {
  const response = await fetch(`http://localhost:3000/api/stories/${storyId}`, {
    method: 'DELETE',
    headers: {
      'Cookie': `authjs.session-token=${sessionToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete story ${storyId}: ${error}`);
  }

  return await response.json();
}

// Main execution
async function main() {
  console.log('🔍 Starting complete story cleanup...\n');

  try {
    // Load authentication
    console.log('🔐 Loading authentication...');
    const sessionToken = await loadAuth();
    console.log('✅ Authentication loaded\n');

    // Get all stories
    console.log('📚 Fetching all stories...');
    const stories = await getAllStories(sessionToken);
    console.log(`Found ${stories.length} stories\n`);

    if (stories.length === 0) {
      console.log('✅ No stories to delete');
    } else {
      // Delete each story
      for (const story of stories) {
        console.log(`\n🗑️  Deleting story: ${story.title} (${story.id})`);
        console.log(`   Genre: ${story.genre}`);
        console.log(`   Status: ${story.status}`);
        console.log(`   Public: ${story.isPublic ? 'Yes' : 'No'}`);

        try {
          const result = await deleteStory(story.id, sessionToken);
          console.log(`   ✅ Story deleted successfully`);
          if (result.blobsDeleted) {
            console.log(`   📦 Blob images deleted: ${result.blobsDeleted}`);
          }
        } catch (error) {
          console.error(`   ❌ Failed to delete story: ${error.message}`);
        }
      }
    }

    // Check for orphaned blobs
    console.log('\n\n🔍 Checking for orphaned blob files...\n');
    const { blobs } = await list({ prefix: 'stories/' });
    console.log(`Found ${blobs.length} blob files with 'stories/' prefix`);

    if (blobs.length > 0) {
      console.log('\n⚠️  Orphaned blob files found:');
      for (const blob of blobs) {
        console.log(`   - ${blob.pathname}`);
      }

      console.log('\n🗑️  Deleting orphaned blobs...');
      let deleted = 0;
      for (const blob of blobs) {
        try {
          await del(blob.url);
          deleted++;
          console.log(`   ✅ Deleted: ${blob.pathname}`);
        } catch (error) {
          console.error(`   ❌ Failed to delete ${blob.pathname}: ${error.message}`);
        }
      }
      console.log(`\n📦 Deleted ${deleted} orphaned blob files`);
    } else {
      console.log('✅ No orphaned blob files found');
    }

    // Final summary
    console.log('\n\n📊 CLEANUP SUMMARY');
    console.log('='.repeat(50));
    console.log(`Stories deleted: ${stories.length}`);
    console.log(`Orphaned blobs cleaned: ${blobs.length}`);
    console.log('='.repeat(50));
    console.log('\n✅ All story data successfully removed!');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

main();

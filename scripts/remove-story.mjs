#!/usr/bin/env node

/**
 * Remove Story Script
 *
 * Removes a single story and all related data:
 * - Database records (parts, chapters, scenes, characters, settings)
 * - Vercel Blob images (character portraits, setting visuals)
 * - Community data (posts, likes, replies)
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID
 *   dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID --dry-run
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { del } from '@vercel/blob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load authentication
async function loadAuth() {
  const authPath = path.join(__dirname, '../.auth/user.json');
  try {
    const authData = await fs.readFile(authPath, 'utf-8');
    const auth = JSON.parse(authData);

    // Extract session cookie
    const sessionCookie = auth.cookies?.find(c =>
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

// Get story details
async function getStoryDetails(storyId, sessionToken) {
  const url = `http://localhost:3000/api/stories/${storyId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cookie': `authjs.session-token=${sessionToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Story not found: ${storyId}`);
    }
    const error = await response.text();
    throw new Error(`Failed to fetch story: ${error}`);
  }

  return await response.json();
}

// Get related data counts
async function getRelatedData(storyId, sessionToken) {
  const endpoints = [
    { name: 'characters', url: `/api/stories/${storyId}/characters` },
    { name: 'settings', url: `/api/stories/${storyId}/settings` },
    { name: 'parts', url: `/api/stories/${storyId}/parts` },
    { name: 'chapters', url: `/api/stories/${storyId}/chapters` },
  ];

  const data = {};

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint.url}`, {
        headers: {
          'Cookie': `authjs.session-token=${sessionToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        data[endpoint.name] = Array.isArray(result) ? result : [];
      } else {
        data[endpoint.name] = [];
      }
    } catch (error) {
      console.warn(`⚠️  Failed to fetch ${endpoint.name}:`, error.message);
      data[endpoint.name] = [];
    }
  }

  return data;
}

// Extract blob URLs from data
function extractBlobUrls(data) {
  const urls = [];

  // Characters with images
  if (data.characters) {
    for (const char of data.characters) {
      if (char.imageUrl) {
        urls.push(char.imageUrl);
      }
    }
  }

  // Settings with images
  if (data.settings) {
    for (const setting of data.settings) {
      if (setting.imageUrl) {
        urls.push(setting.imageUrl);
      }
    }
  }

  return urls;
}

// Delete blob images
async function deleteBlobImages(urls, dryRun = false) {
  if (urls.length === 0) {
    console.log('📦 No blob images to delete');
    return { deleted: 0, failed: [] };
  }

  console.log(`📦 Found ${urls.length} blob images to delete`);

  if (dryRun) {
    console.log('🔍 [DRY RUN] Would delete images:');
    urls.forEach(url => console.log(`   - ${url}`));
    return { deleted: urls.length, failed: [] };
  }

  const results = {
    deleted: 0,
    failed: [],
  };

  for (const url of urls) {
    try {
      await del(url);
      results.deleted++;
      console.log(`   ✓ Deleted: ${url}`);
    } catch (error) {
      results.failed.push({ url, error: error.message });
      console.warn(`   ✗ Failed to delete: ${url} (${error.message})`);
    }
  }

  return results;
}

// Delete story via API
async function deleteStory(storyId, sessionToken, dryRun = false) {
  if (dryRun) {
    console.log('🔍 [DRY RUN] Would delete story via API');
    return true;
  }

  const url = `http://localhost:3000/api/stories/${storyId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Cookie': `authjs.session-token=${sessionToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete story: ${error}`);
  }

  return true;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Usage: node scripts/remove-story.mjs STORY_ID [--dry-run]');
    process.exit(1);
  }

  const storyId = args[0];
  const dryRun = args.includes('--dry-run');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No actual deletions will occur\n');
  }

  try {
    console.log('🔐 Loading authentication...');
    const sessionToken = await loadAuth();

    console.log(`🔍 Finding story: ${storyId}`);
    const story = await getStoryDetails(storyId, sessionToken);

    console.log(`\n📖 Story: "${story.title}"`);
    console.log(`   Genre: ${story.genre || 'N/A'}`);
    console.log(`   Status: ${story.status}`);
    console.log(`   Created: ${new Date(story.createdAt).toLocaleDateString()}`);

    console.log('\n🔍 Finding related data...');
    const relatedData = await getRelatedData(storyId, sessionToken);

    const charactersWithImages = relatedData.characters.filter(c => c.imageUrl).length;
    const settingsWithImages = relatedData.settings.filter(s => s.imageUrl).length;

    console.log(`   📚 Parts: ${relatedData.parts.length}`);
    console.log(`   📝 Chapters: ${relatedData.chapters.length}`);
    console.log(`   👥 Characters: ${relatedData.characters.length} (${charactersWithImages} with images)`);
    console.log(`   🏞️  Settings: ${relatedData.settings.length} (${settingsWithImages} with images)`);

    const blobUrls = extractBlobUrls(relatedData);

    if (!dryRun) {
      console.log('\n⚠️  This will permanently delete all story data and images.');
      console.log('Press Ctrl+C to cancel, or wait 3 seconds to proceed...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n🗑️  Starting removal process...\n');

    // Delete blob images
    const blobResults = await deleteBlobImages(blobUrls, dryRun);

    // Delete story (cascades to all related records)
    console.log('\n🗑️  Removing database records...');
    await deleteStory(storyId, sessionToken, dryRun);

    console.log('\n✅ Story removed successfully!\n');

    console.log('📊 Cleanup Summary:');
    console.log(`   Story: "${story.title}" (ID: ${storyId})`);
    console.log(`   Parts: ${relatedData.parts.length}`);
    console.log(`   Chapters: ${relatedData.chapters.length}`);
    console.log(`   Characters: ${relatedData.characters.length}`);
    console.log(`   Settings: ${relatedData.settings.length}`);
    console.log(`   Blob images deleted: ${blobResults.deleted}`);

    if (blobResults.failed.length > 0) {
      console.log(`\n⚠️  Failed to delete ${blobResults.failed.length} blob images:`);
      blobResults.failed.forEach(f => console.log(`   - ${f.url}: ${f.error}`));
    }

    if (dryRun) {
      console.log('\n🔍 DRY RUN COMPLETE - No actual changes were made');
    } else {
      console.log('\n✨ All data has been permanently removed.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

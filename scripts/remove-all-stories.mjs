#!/usr/bin/env node

/**
 * Remove All Stories Script
 *
 * Removes all stories for a user and all related data:
 * - Database records (parts, chapters, scenes, characters, settings)
 * - Vercel Blob images (character portraits, setting visuals)
 * - Community data (posts, likes, replies)
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/remove-all-stories.mjs --confirm
 *   dotenv --file .env.local run node scripts/remove-all-stories.mjs --dry-run
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

// Get all stories
async function getAllStories(sessionToken) {
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

// Get related data for a story
async function getRelatedData(storyId, sessionToken) {
  const endpoints = [
    { name: 'characters', url: `/api/stories/${storyId}/characters` },
    { name: 'settings', url: `/api/stories/${storyId}/settings` },
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
      data[endpoint.name] = [];
    }
  }

  return data;
}

// Extract blob URLs
function extractBlobUrls(data) {
  const urls = [];

  if (data.characters) {
    for (const char of data.characters) {
      if (char.imageUrl) urls.push(char.imageUrl);
    }
  }

  if (data.settings) {
    for (const setting of data.settings) {
      if (setting.imageUrl) urls.push(setting.imageUrl);
    }
  }

  return urls;
}

// Delete blob images in batches
async function deleteBlobImages(urls, dryRun = false) {
  if (urls.length === 0) return { deleted: 0, failed: [] };

  if (dryRun) {
    console.log(`   🔍 [DRY RUN] Would delete ${urls.length} images`);
    return { deleted: urls.length, failed: [] };
  }

  const results = { deleted: 0, failed: [] };

  // Delete all URLs in a single batch operation for efficiency
  // Vercel Blob's del() supports array of URLs
  const startTime = Date.now();

  try {
    await del(urls);
    results.deleted = urls.length;
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`   ⚡ Batch deleted ${urls.length} images in ${duration}s`);
  } catch (error) {
    // If batch delete fails, fall back to individual deletion
    console.warn(`   ⚠️  Batch delete failed: ${error.message}`);
    console.log(`   🔄 Falling back to individual deletion...`);

    for (const url of urls) {
      try {
        await del(url);
        results.deleted++;
      } catch (err) {
        results.failed.push({ url, error: err.message });
      }
    }
  }

  return results;
}

// Delete story
async function deleteStory(storyId, sessionToken, dryRun = false) {
  if (dryRun) {
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
    throw new Error(`Failed to delete story ${storyId}: ${error}`);
  }

  return true;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const confirmed = args.includes('--confirm');

  if (!dryRun && !confirmed) {
    console.error('❌ You must use --confirm or --dry-run flag');
    console.error('Usage: node scripts/remove-all-stories.mjs --confirm');
    console.error('       node scripts/remove-all-stories.mjs --dry-run');
    process.exit(1);
  }

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No actual deletions will occur\n');
  }

  try {
    console.log('🔐 Loading authentication...');
    const sessionToken = await loadAuth();

    console.log('🔍 Finding all stories...');
    const stories = await getAllStories(sessionToken);

    if (!Array.isArray(stories) || stories.length === 0) {
      console.log('\n✅ No stories found to remove.');
      return;
    }

    console.log(`\n📖 Found ${stories.length} stories:\n`);

    const allBlobUrls = [];
    const storyDetails = [];

    for (const story of stories) {
      console.log(`   - "${story.title}" (${story.id})`);
      console.log(`     Genre: ${story.genre || 'N/A'}, Status: ${story.status}`);

      const relatedData = await getRelatedData(story.id, sessionToken);
      const blobUrls = extractBlobUrls(relatedData);

      storyDetails.push({
        story,
        relatedData,
        blobUrls,
      });

      allBlobUrls.push(...blobUrls);

      const charactersWithImages = relatedData.characters.filter(c => c.imageUrl).length;
      const settingsWithImages = relatedData.settings.filter(s => s.imageUrl).length;

      console.log(`     Characters: ${relatedData.characters.length} (${charactersWithImages} with images)`);
      console.log(`     Settings: ${relatedData.settings.length} (${settingsWithImages} with images)`);
      console.log();
    }

    console.log('📊 Total Summary:');
    console.log(`   Stories: ${stories.length}`);
    console.log(`   Blob images: ${allBlobUrls.length}`);

    if (!dryRun) {
      console.log('\n⚠️  This will PERMANENTLY delete ALL stories and related data!');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('\n🗑️  Starting removal process...\n');

    let totalDeleted = 0;
    let totalBlobsDeleted = 0;
    const failedBlobs = [];

    for (let i = 0; i < storyDetails.length; i++) {
      const { story, blobUrls } = storyDetails[i];

      console.log(`[${i + 1}/${storyDetails.length}] Removing "${story.title}"...`);

      // Delete blobs
      if (blobUrls.length > 0) {
        const blobResults = await deleteBlobImages(blobUrls, dryRun);
        totalBlobsDeleted += blobResults.deleted;
        failedBlobs.push(...blobResults.failed);

        if (!dryRun) {
          console.log(`   📦 Deleted ${blobResults.deleted} images`);
        }
      }

      // Delete story
      await deleteStory(story.id, sessionToken, dryRun);
      totalDeleted++;

      if (!dryRun) {
        console.log(`   ✓ Story removed\n`);
      }
    }

    console.log('\n✅ Removal complete!\n');

    console.log('📊 Final Summary:');
    console.log(`   Stories removed: ${totalDeleted}`);
    console.log(`   Blob images deleted: ${totalBlobsDeleted}`);

    if (failedBlobs.length > 0) {
      console.log(`\n⚠️  Failed to delete ${failedBlobs.length} blob images:`);
      failedBlobs.forEach(f => console.log(`   - ${f.url}`));
    }

    if (dryRun) {
      console.log('\n🔍 DRY RUN COMPLETE - No actual changes were made');
    } else {
      console.log('\n✨ All stories and data have been permanently removed.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

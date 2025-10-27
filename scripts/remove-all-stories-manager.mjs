#!/usr/bin/env node

import fetch from 'node-fetch';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env.local') });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const AUTH_FILE_PATH = join(__dirname, '../.auth/user.json');

function loadManagerAuth() {
  const authData = JSON.parse(fs.readFileSync(AUTH_FILE_PATH, 'utf-8'));
  return {
    apiKey: authData.profiles?.manager?.apiKey,
    email: authData.profiles?.manager?.email
  };
}

async function main() {
  const args = process.argv.slice(2);
  const confirmed = args.includes('--confirm');

  console.log('\n' + '='.repeat(80));
  console.log('🗑️  REMOVE ALL STORIES (Manager)');
  console.log('='.repeat(80));

  const { apiKey, email } = loadManagerAuth();
  console.log(`\n🔐 Authenticated as: ${email}`);
  console.log(`   Using API key with admin:all scope\n`);

  // Get all stories
  const storiesResp = await fetch(`${API_BASE_URL}/api/stories`, {
    headers: { 'x-api-key': apiKey }
  });

  if (!storiesResp.ok) {
    throw new Error(`Failed to fetch stories: ${storiesResp.status}`);
  }

  const data = await storiesResp.json();
  const stories = data.stories || data;

  console.log(`📚 Found ${stories.length} stories to remove:\n`);
  stories.forEach((story, i) => {
    console.log(`   ${i + 1}. "${story.title}" (${story.id}) - Author: ${story.authorId || 'unknown'}`);
  });

  if (stories.length === 0) {
    console.log('\n✅ No stories to remove!\n');
    return;
  }

  if (!confirmed) {
    console.log('\n⚠️  This will permanently delete ALL stories from ALL users:');
    console.log('   - Database records (stories, chapters, scenes, characters, settings)');
    console.log('   - Vercel Blob images (all story assets)');
    console.log('   - Community data (posts, likes, comments)\n');
    console.log('   Run with --confirm to proceed:\n');
    console.log('   dotenv --file .env.local run node scripts/remove-all-stories-manager.mjs --confirm\n');
    return;
  }

  console.log('\n🗑️  Starting deletion with manager privileges...\n');

  let successCount = 0;
  let failCount = 0;

  for (const story of stories) {
    console.log(`   Deleting "${story.title}" (${story.id})...`);
    
    const deleteResp = await fetch(`${API_BASE_URL}/api/stories/${story.id}`, {
      method: 'DELETE',
      headers: { 'x-api-key': apiKey }
    });

    if (deleteResp.ok) {
      console.log(`   ✅ Deleted successfully (including all images)\n`);
      successCount++;
    } else {
      const error = await deleteResp.text();
      console.log(`   ❌ Failed: ${deleteResp.status} - ${error}\n`);
      failCount++;
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('='.repeat(80));
  console.log(`✅ Successfully deleted: ${successCount} stories`);
  if (failCount > 0) {
    console.log(`❌ Failed to delete: ${failCount} stories`);
  }
  console.log('\n✅ Database and Vercel Blob cleanup complete!');
  console.log('='.repeat(80));
  console.log('');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});

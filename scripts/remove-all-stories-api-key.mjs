#!/usr/bin/env node

/**
 * Remove all stories using API key authentication
 */

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

function loadWriterAuth() {
  const authData = JSON.parse(fs.readFileSync(AUTH_FILE_PATH, 'utf-8'));
  return {
    apiKey: authData.profiles?.writer?.apiKey,
    email: authData.profiles?.writer?.email
  };
}

async function main() {
  const args = process.argv.slice(2);
  const confirmed = args.includes('--confirm');

  console.log('\n' + '='.repeat(80));
  console.log('🗑️  REMOVE ALL STORIES');
  console.log('='.repeat(80));

  const { apiKey, email } = loadWriterAuth();
  console.log(`\n🔐 Authenticated as: ${email}\n`);

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
    console.log(`   ${i + 1}. "${story.title}" (${story.id})`);
  });

  if (stories.length === 0) {
    console.log('\n✅ No stories to remove!\n');
    return;
  }

  if (!confirmed) {
    console.log('\n⚠️  This will permanently delete all stories, images, and data.');
    console.log('   Run with --confirm to proceed:\n');
    console.log('   dotenv --file .env.local run node scripts/remove-all-stories-api-key.mjs --confirm\n');
    return;
  }

  console.log('\n🗑️  Starting deletion...\n');

  let successCount = 0;
  let failCount = 0;

  for (const story of stories) {
    console.log(`   Deleting "${story.title}"...`);
    
    const deleteResp = await fetch(`${API_BASE_URL}/api/stories/${story.id}`, {
      method: 'DELETE',
      headers: { 'x-api-key': apiKey }
    });

    if (deleteResp.ok) {
      console.log(`   ✅ Deleted successfully\n`);
      successCount++;
    } else {
      const error = await deleteResp.text();
      console.log(`   ❌ Failed: ${deleteResp.status} - ${error}\n`);
      failCount++;
    }
  }

  console.log('='.repeat(80));
  console.log(`✅ Successfully deleted: ${successCount} stories`);
  if (failCount > 0) {
    console.log(`❌ Failed to delete: ${failCount} stories`);
  }
  console.log('='.repeat(80));
  console.log('');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

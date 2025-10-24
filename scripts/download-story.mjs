#!/usr/bin/env node

/**
 * Simple script to download an existing story
 *
 * Usage: node scripts/download-story.mjs <story-id>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Load API key from .auth/user.json
let API_KEY = '';
try {
  const authFile = path.join(__dirname, '..', '.auth', 'user.json');
  if (fs.existsSync(authFile)) {
    const authData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    API_KEY = authData.apiKey || '';
  }
} catch (error) {
  console.error('Warning: Could not load API key from .auth/user.json:', error.message);
}

async function downloadStory(storyId) {
  console.log(`📦 Downloading story package for: ${storyId}`);

  const response = await fetch(`${BASE_URL}/api/stories/${storyId}/download`, {
    method: 'GET',
    headers: API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {},
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to download story: ${response.status} ${response.statusText}\n${JSON.stringify(errorData, null, 2)}`);
  }

  // Save the ZIP file
  const buffer = Buffer.from(await response.arrayBuffer());

  // Create downloads directory if it doesn't exist
  const downloadsDir = path.join(__dirname, '..', 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  const filename = path.join(downloadsDir, `story_${storyId}_${Date.now()}.zip`);
  fs.writeFileSync(filename, buffer);

  console.log(`✅ Story package saved to: ${filename}`);

  // Show file size
  const stats = fs.statSync(filename);
  console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  return filename;
}

async function main() {
  const storyId = process.argv[2];

  if (!storyId) {
    console.error('Usage: node scripts/download-story.mjs <story-id>');
    console.error('\nExample: node scripts/download-story.mjs abc123');
    process.exit(1);
  }

  try {
    const downloadPath = await downloadStory(storyId);

    console.log();
    console.log('Next steps:');
    console.log(`1. Extract the ZIP file: unzip "${downloadPath}"`);
    console.log('2. Review the contents:');
    console.log('   - Story markdown file with all scenes');
    console.log('   - HNS data files for story/parts/chapters/scenes');
    console.log('   - Character images and data');
    console.log('   - Setting images and data');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

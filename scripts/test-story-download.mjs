#!/usr/bin/env node

/**
 * Test script for story generation and download
 *
 * This script:
 * 1. Generates a new story using the HNS API
 * 2. Downloads all story content as a ZIP file
 * 3. Saves it to the downloads directory
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_KEY = process.env.TEST_API_KEY || ''; // Set this in your .env.local

// Story prompt for testing
const STORY_PROMPT = `I want to write a cyberpunk noir story about a detective in Neo-Tokyo who investigates a series of mysterious deaths linked to a new virtual reality technology. The protagonist, Detective Kira Tanaka, discovers that the victims' consciousness has been uploaded to a digital afterlife controlled by a powerful megacorporation.`;

async function generateStory() {
  console.log('🚀 Starting story generation...');
  console.log('Prompt:', STORY_PROMPT);

  const response = await fetch(`${BASE_URL}/api/stories/generate-hns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      prompt: STORY_PROMPT,
      language: 'English',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate story: ${response.status} ${response.statusText}`);
  }

  // Handle SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let storyId = null;
  let buffer = '';

  console.log('📡 Receiving story generation updates...\n');

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.phase === 'progress') {
              console.log(`⏳ ${data.data.step}: ${data.data.message}`);
            } else if (data.phase === 'hns_complete') {
              console.log('✅ HNS structure generated');
            } else if (data.phase === 'complete') {
              storyId = data.data.storyId;
              console.log(`\n✅ Story generation complete! Story ID: ${storyId}`);
            } else if (data.phase === 'error') {
              throw new Error(`Generation error: ${data.error}`);
            }
          } catch (e) {
            if (e instanceof SyntaxError) {
              // Ignore JSON parse errors for incomplete chunks
            } else {
              throw e;
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!storyId) {
    throw new Error('Story generation completed but no story ID was returned');
  }

  return storyId;
}

async function downloadStory(storyId) {
  console.log(`\n📦 Downloading story package for: ${storyId}`);

  const response = await fetch(`${BASE_URL}/api/stories/${storyId}/download`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
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
  try {
    console.log('='.repeat(60));
    console.log('Story Generation and Download Test');
    console.log('='.repeat(60));
    console.log();

    // Check if API key is set (for session-based auth, this might not be needed)
    if (!API_KEY && BASE_URL.includes('localhost')) {
      console.log('⚠️  Warning: No API_KEY set. Using session-based authentication.');
      console.log('    Make sure you are logged in to the app in your browser.');
    }

    // Step 1: Generate story
    const storyId = await generateStory();

    // Step 2: Download story
    const downloadPath = await downloadStory(storyId);

    console.log();
    console.log('='.repeat(60));
    console.log('✅ Test completed successfully!');
    console.log('='.repeat(60));
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
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

main();

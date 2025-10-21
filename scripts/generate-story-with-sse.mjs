#!/usr/bin/env node

/**
 * Generate a story and display SSE (Server-Sent Events) responses in real-time
 *
 * This script demonstrates the full story generation process with live progress updates.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_KEY = process.env.TEST_API_KEY || '';

// Story prompt
const STORY_PROMPT = process.argv[2] || `I want to write a science fiction story about a Mars colony in 2157. The protagonist, Dr. Elena Martinez, is a xenobiologist who discovers mysterious underground structures that suggest Mars was inhabited millions of years ago. As she investigates deeper, she uncovers a warning left by an ancient civilization about a cosmic threat that's returning.`;

console.log('='.repeat(80));
console.log('Story Generation with SSE Response Display');
console.log('='.repeat(80));
console.log();
console.log('📝 Story Prompt:');
console.log(STORY_PROMPT);
console.log();
console.log('='.repeat(80));
console.log();

async function generateStoryWithSSE() {
  console.log('🚀 Starting story generation...\n');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
    console.log('🔑 Using API key authentication\n');
  } else {
    console.log('⚠️  No API key found. Make sure you are authenticated.\n');
  }

  const response = await fetch(`${BASE_URL}/api/stories/generate-hns`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: STORY_PROMPT,
      language: 'English',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to start generation: ${response.status} ${response.statusText}\n${errorText}`);
  }

  console.log('✅ Generation started. Receiving SSE updates...\n');
  console.log('-'.repeat(80));
  console.log();

  // Process SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let storyId = null;
  let hnsDocument = null;
  let eventCount = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('\n📡 Stream ended');
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            eventCount++;
            const data = JSON.parse(line.slice(6));
            const timestamp = new Date().toLocaleTimeString();

            console.log(`[${timestamp}] Event #${eventCount}: ${data.phase}`);
            console.log('-'.repeat(80));

            if (data.phase === 'progress') {
              console.log(`📊 Step: ${data.data.step}`);
              console.log(`💬 Message: ${data.data.message}`);

              if (data.data.storyId) {
                console.log(`🆔 Story ID: ${data.data.storyId}`);
              }

              if (data.data.title) {
                console.log(`📖 Title: ${data.data.title}`);
              }

              if (data.data.genre) {
                console.log(`🎭 Genre: ${data.data.genre}`);
              }

            } else if (data.phase === 'hns_complete') {
              console.log('✅ HNS Structure Generated');
              hnsDocument = data.data.hnsDocument;

              if (hnsDocument) {
                console.log(`📖 Title: ${hnsDocument.story?.title || 'N/A'}`);
                console.log(`🎭 Genre: ${hnsDocument.story?.genre || 'N/A'}`);
                console.log(`📝 Premise: ${hnsDocument.story?.premise?.substring(0, 100) || 'N/A'}...`);
                console.log(`📚 Parts: ${hnsDocument.parts?.length || 0}`);
                console.log(`📑 Chapters: ${hnsDocument.chapters?.length || 0}`);
                console.log(`👥 Characters: ${hnsDocument.characters?.length || 0}`);
                console.log(`🏛️ Settings: ${hnsDocument.settings?.length || 0}`);
              }

            } else if (data.phase === 'complete') {
              storyId = data.data.storyId;
              console.log('🎉 Story Generation Complete!');
              console.log(`🆔 Story ID: ${storyId}`);

              if (data.data.story) {
                console.log(`📖 Title: ${data.data.story.title || 'N/A'}`);
                console.log(`🎭 Genre: ${data.data.story.genre || 'N/A'}`);
              }

              if (data.data.characters) {
                console.log(`\n👥 Characters Generated:`);
                data.data.characters.forEach((char, i) => {
                  console.log(`   ${i + 1}. ${char.name} ${char.imageUrl ? '🖼️' : ''}`);
                });
              }

              if (data.data.settings) {
                console.log(`\n🏛️ Settings Generated:`);
                data.data.settings.forEach((setting, i) => {
                  console.log(`   ${i + 1}. ${setting.name} ${setting.imageUrl ? '🖼️' : ''}`);
                });
              }

            } else if (data.phase === 'error') {
              console.log('❌ Error occurred:');
              console.log(`   ${data.error}`);
            } else {
              console.log(`📦 Data:`, JSON.stringify(data.data, null, 2).substring(0, 200));
            }

            console.log();

          } catch (e) {
            if (!(e instanceof SyntaxError)) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  console.log('='.repeat(80));
  console.log('\n📊 Summary:');
  console.log(`   Total Events: ${eventCount}`);
  if (storyId) {
    console.log(`   Story ID: ${storyId}`);
    console.log(`\n📥 To download this story:`);
    console.log(`   dotenv --file .env.local run node scripts/download-story.mjs ${storyId}`);
  }
  console.log();
  console.log('='.repeat(80));

  return { storyId, hnsDocument };
}

async function main() {
  try {
    const result = await generateStoryWithSSE();

    if (result.storyId) {
      // Save summary to file
      const summaryPath = path.join(__dirname, '..', 'logs', `story-generation-${result.storyId}.json`);
      fs.writeFileSync(summaryPath, JSON.stringify({
        storyId: result.storyId,
        timestamp: new Date().toISOString(),
        prompt: STORY_PROMPT,
        hnsDocument: result.hnsDocument,
      }, null, 2));
      console.log(`\n💾 Summary saved to: ${summaryPath}\n`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

main();

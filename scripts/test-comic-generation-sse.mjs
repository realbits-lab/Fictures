#!/usr/bin/env node

/**
 * Test Comic Generation with SSE Progress Updates
 *
 * This script demonstrates real-time progress monitoring of comic panel generation
 * using Server-Sent Events (SSE). It connects to the comic generation API and
 * displays live progress updates as panels are being generated.
 *
 * Usage:
 *   node scripts/test-comic-generation-sse.mjs <scene-id>
 *
 * Example:
 *   node scripts/test-comic-generation-sse.mjs Kc5iFMCSL35CxbKbTJZlX
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EventSource } from 'eventsource'; // npm install eventsource

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const sceneId = args[0];

if (!sceneId) {
  console.error('❌ Usage: node scripts/test-comic-generation-sse.mjs <scene-id>');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/test-comic-generation-sse.mjs Kc5iFMCSL35CxbKbTJZlX');
  process.exit(1);
}

async function loadAuth() {
  try {
    const authPath = path.join(__dirname, '../.auth/user.json');
    const authData = JSON.parse(await fs.readFile(authPath, 'utf-8'));

    if (!authData.profiles?.manager) {
      throw new Error('manager profile not found in .auth/user.json');
    }

    const profile = authData.profiles.manager;
    const cookies = profile.cookies
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    return {
      ...profile,
      cookieHeader: cookies,
    };
  } catch (error) {
    console.error('❌ Failed to load authentication data:', error.message);
    process.exit(1);
  }
}

async function testComicGenerationWithSSE(sceneId, auth) {
  const baseUrl = 'http://localhost:3000';
  const url = `${baseUrl}/api/scenes/${sceneId}/comic/generate`;

  console.log('🎨 Testing Comic Generation with SSE\n');
  console.log('━'.repeat(60));
  console.log(`Scene ID: ${sceneId}`);
  console.log(`API Endpoint: ${url}`);
  console.log('Transport: Server-Sent Events (SSE)');
  console.log('');

  console.log('📡 Initiating POST request with SSE...\n');

  // First, send POST request to start generation
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': auth.cookieHeader,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        regenerate: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HTTP ${response.status}: ${error.error || 'Unknown error'}`);
    }

    console.log('✅ SSE connection established\n');
    console.log('━'.repeat(60));
    console.log('📊 Real-time Progress Updates:');
    console.log('━'.repeat(60));
    console.log('');

    // Read SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;

        // Parse SSE message
        const eventMatch = line.match(/^event: (.+)$/m);
        const dataMatch = line.match(/^data: (.+)$/m);

        if (eventMatch && dataMatch) {
          const event = eventMatch[1];
          const data = JSON.parse(dataMatch[1]);

          if (event === 'start') {
            console.log(`🚀 Starting: ${data.message}`);
            console.log(`   Scene: ${data.sceneTitle}`);
            console.log('');
          } else if (event === 'progress') {
            const bar = '█'.repeat(Math.floor(data.percentage / 5));
            const empty = '░'.repeat(20 - bar.length);
            console.log(`[${bar}${empty}] ${data.percentage}% - ${data.status}`);
          } else if (event === 'complete') {
            console.log('');
            console.log('━'.repeat(60));
            console.log('✅ Generation Complete!');
            console.log('━'.repeat(60));
            console.log('');
            console.log('Scene Details:');
            console.log(`  ID: ${data.scene.id}`);
            console.log(`  Title: ${data.scene.title}`);
            console.log(`  Status: ${data.scene.comicStatus}`);
            console.log(`  Panel Count: ${data.scene.comicPanelCount}`);
            console.log(`  Version: ${data.scene.comicVersion}`);
            console.log('');
            if (data.metadata) {
              console.log('Metadata:');
              console.log(`  Total Generation Time: ${(data.metadata.total_generation_time / 1000).toFixed(2)}s`);
              console.log(`  Total Panels: ${data.metadata.total_panels}`);
              console.log(`  Total Images: ${data.metadata.total_images}`);
              console.log(`  Estimated Reading Time: ${data.metadata.estimated_reading_time}`);
            }
          } else if (event === 'error') {
            console.log('');
            console.log('━'.repeat(60));
            console.log('❌ Generation Failed!');
            console.log('━'.repeat(60));
            console.log('');
            console.log(`Error: ${data.error}`);
            console.log(`Message: ${data.message}`);
          }
        }
      }
    }

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('');
    console.log('━'.repeat(60));
    console.log(`⏱️  Total Time: ${elapsedTime}s`);
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('');
    console.error('❌ Failed to generate comic panels:', error.message);
    process.exit(1);
  }
}

// Main execution
console.log('🔑 Loading authentication...\n');

const auth = await loadAuth();

console.log(`✓ Authenticated as: ${auth.name} (${auth.email})`);
console.log(`✓ User ID: ${auth.userId}`);
console.log(`✓ Role: ${auth.role}`);
console.log(`✓ Cookies: ${auth.cookies.length} cookies loaded`);
console.log('');

await testComicGenerationWithSSE(sceneId, auth);

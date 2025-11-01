#!/usr/bin/env node

/**
 * Test Story Image Generation
 *
 * Tests that story cover images are generated correctly during novel generation.
 * Verifies:
 * 1. Story is created successfully
 * 2. Story cover image URL is present
 * 3. Image is accessible from Vercel Blob
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.POSTGRES_URL);

// Get authentication token from .auth/user.json
const authPath = '.auth/user.json';
let authCookies;

try {
  const { readFileSync } = await import('fs');
  const authData = JSON.parse(readFileSync(authPath, 'utf-8'));

  // Get manager profile (or writer profile)
  const profile = authData.profiles?.manager || authData.profiles?.writer;
  if (!profile || !profile.cookies) {
    console.error('❌ No profile with cookies found in .auth/user.json');
    console.error('Run: dotenv --file .env.local run node scripts/capture-auth-manual.mjs');
    process.exit(1);
  }

  // Extract session cookie
  const sessionCookie = profile.cookies.find(c =>
    c.name === 'authjs.session-token' || c.name === '__Secure-authjs.session-token'
  );

  if (!sessionCookie) {
    console.error('❌ No session cookie found in profile');
    console.error('Run: dotenv --file .env.local run node scripts/capture-auth-manual.mjs');
    process.exit(1);
  }

  authCookies = `${sessionCookie.name}=${sessionCookie.value}`;
  console.log(`✓ Loaded authentication from .auth/user.json (${profile.email})`);
} catch (error) {
  console.error('❌ Failed to load authentication:', error.message);
  process.exit(1);
}

async function generateStoryAndVerifyImage() {
  console.log('\n📚 Starting story generation test...\n');

  const startTime = Date.now();

  // Generate a minimal story for testing
  const generationRequest = {
    userPrompt: 'A young programmer discovers a bug that changes reality',
    preferredGenre: 'science fiction',
    preferredTone: 'hopeful',
    characterCount: 2,
    settingCount: 1,
    partsCount: 1,
    chaptersPerPart: 2,
    scenesPerChapter: 2,
    language: 'en',
  };

  console.log('📝 Generation Parameters:');
  console.log(`   Prompt: ${generationRequest.userPrompt}`);
  console.log(`   Characters: ${generationRequest.characterCount}`);
  console.log(`   Settings: ${generationRequest.settingCount}`);
  console.log(`   Parts: ${generationRequest.partsCount}`);
  console.log(`   Chapters per Part: ${generationRequest.chaptersPerPart}`);
  console.log(`   Scenes per Chapter: ${generationRequest.scenesPerChapter}\n`);

  let storyId = null;

  try {
    // Start generation via SSE stream
    const response = await fetch('http://localhost:3000/studio/api/novels/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookies,
      },
      body: JSON.stringify(generationRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log('📡 Streaming generation progress...\n');

    // Parse SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(line.slice(6));

          // Log progress
          if (data.phase && data.message) {
            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            console.log(`[${timestamp}] ${data.phase}: ${data.message}`);

            // Show percentage for progress phases
            if (data.data?.percentage) {
              console.log(`           Progress: ${data.data.percentage}%`);
            }
          }

          // Capture story ID from completion
          if (data.phase === 'complete' && data.data?.storyId) {
            storyId = data.data.storyId;
            console.log(`\n✓ Story generated: ${storyId}`);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    if (!storyId) {
      throw new Error('Story ID not returned from generation');
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Generation completed in ${duration}s\n`);

    // Verify story in database
    console.log('🔍 Verifying story in database...');

    const stories = await sql`
      SELECT id, title, genre, status, image_url
      FROM stories
      WHERE id = ${storyId}
      LIMIT 1
    `;

    if (!stories || stories.length === 0) {
      throw new Error('Story not found in database');
    }

    const story = stories[0];

    console.log(`   Story ID: ${story.id}`);
    console.log(`   Title: ${story.title}`);
    console.log(`   Genre: ${story.genre}`);
    console.log(`   Status: ${story.status}`);

    // Check cover image
    console.log('\n🖼️  Checking story cover image...');

    if (!story.image_url) {
      console.error('   ❌ No cover image URL found!');
      console.error('   Story record:', JSON.stringify(story, null, 2));
      process.exit(1);
    }

    console.log(`   ✓ Cover image URL: ${story.image_url}`);

    // Verify image is accessible
    console.log('\n🌐 Verifying image accessibility...');

    try {
      const imageResponse = await fetch(story.image_url, { method: 'HEAD' });

      if (!imageResponse.ok) {
        throw new Error(`Image not accessible: HTTP ${imageResponse.status}`);
      }

      const contentType = imageResponse.headers.get('content-type');
      const contentLength = imageResponse.headers.get('content-length');

      console.log(`   ✓ Image accessible`);
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Size: ${(parseInt(contentLength) / 1024).toFixed(2)} KB`);

    } catch (error) {
      console.error(`   ❌ Image not accessible: ${error.message}`);
      process.exit(1);
    }

    console.log('\n✅ Story image generation test PASSED!\n');
    console.log('Summary:');
    console.log(`   - Story created: ${story.id}`);
    console.log(`   - Cover image: ${story.image_url}`);
    console.log(`   - Image verified: Accessible from Vercel Blob`);
    console.log(`   - Duration: ${duration}s\n`);

  } catch (error) {
    console.error('\n❌ Story generation failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
generateStoryAndVerifyImage();

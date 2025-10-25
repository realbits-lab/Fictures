#!/usr/bin/env node

/**
 * Generate and publish a new story using the writer@fictures.xyz account
 *
 * This script:
 * 1. Reads API key from .auth/user.json
 * 2. Creates a story using the /api/stories endpoint
 * 3. Publishes the story by updating its status
 */

import { config } from 'dotenv';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const WRITER_EMAIL = 'writer@fictures.xyz';
const AUTH_FILE = path.join(__dirname, '..', '.auth', 'user.json');

async function generateAndPublishStory() {
  const sql = postgres(process.env.POSTGRES_URL);

  try {
    console.log('📚 Creating and publishing story with writer@fictures.xyz...\n');

    // Step 1: Load API key from .auth/user.json
    console.log('1️⃣ Loading API key from .auth/user.json...');

    if (!fs.existsSync(AUTH_FILE)) {
      throw new Error(`Authentication file not found: ${AUTH_FILE}`);
    }

    const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
    const writerProfile = authData.profiles?.writer;

    if (!writerProfile?.apiKey) {
      throw new Error('Writer API key not found in .auth/user.json');
    }

    const apiKey = writerProfile.apiKey;
    console.log(`   ✅ API Key loaded: ${apiKey.substring(0, 20)}...\n`);
    console.log(`   📧 Email: ${writerProfile.email}`);
    console.log(`   👤 Name: ${writerProfile.name}`);
    console.log(`   🔐 Scopes: ${writerProfile.apiKeyScopes?.join(', ')}\n`);

    // Step 2: Create story via API
    console.log('2️⃣ Creating story via API...');
    const storyData = {
      title: "Memory Thieves: A Digital Conspiracy",
      description: "A sci-fi thriller about a data analyst who discovers that memories can be extracted and sold on the black market. When their own memories start disappearing, they must race against time to find who's stealing them and why, uncovering a conspiracy that goes deeper than anyone imagined.",
      genre: "Science Fiction Thriller",
      targetWordCount: 80000
    };

    console.log(`   📝 Story title: ${storyData.title}\n`);
    console.log(`   🔑 Using API key: ${apiKey.substring(0, 25)}...\n`);

    const createResponse = await fetch(`${BASE_URL}/api/stories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(storyData)
    });

    console.log(`   📡 API Response status: ${createResponse.status}`);

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(`   ❌ Error response: ${errorText}`);
      throw new Error(`Story creation failed: ${createResponse.status} - ${errorText}`);
    }

    const createResult = await createResponse.json();
    const storyId = createResult.story?.id;

    if (!storyId) {
      console.error('   ❌ Create result:', JSON.stringify(createResult, null, 2));
      throw new Error('Story ID not found in response');
    }

    console.log('   ✅ Story created successfully!');
    console.log(`   📚 Story ID: ${storyId}`);
    console.log(`   📖 Title: ${createResult.story?.title || 'Unknown'}`);
    console.log(`   🎭 Genre: ${createResult.story?.genre || 'Unknown'}\n`);

    // Step 4: Publish the story (update status in database directly)
    console.log('4️⃣ Publishing story...');
    const publishedStories = await sql`
      UPDATE stories
      SET status = 'published', updated_at = NOW()
      WHERE id = ${storyId}
      RETURNING id, title, status
    `;

    if (publishedStories.length === 0) {
      throw new Error('Failed to publish story');
    }

    console.log('   ✅ Story published successfully!');
    console.log(`   🌐 Status: ${publishedStories[0].status}\n`);

    // Print summary
    console.log('='.repeat(80));
    console.log('✅ STORY CREATION AND PUBLISHING COMPLETED!');
    console.log('='.repeat(80));
    console.log(`\n📚 Story ID: ${storyId}`);
    console.log(`📖 Title: ${storyData.title}`);
    console.log(`👤 Author: ${writerUser.email}`);
    console.log(`🌐 Status: published`);
    console.log(`\n🔗 View story: ${BASE_URL}/stories/${storyId}`);
    console.log(`🔗 Read story: ${BASE_URL}/read/${storyId}`);
    console.log('\n' + '='.repeat(80));

    // Cleanup: Deactivate the API key after use
    console.log('\n🧹 Cleaning up: Deactivating API key...');
    await sql`
      UPDATE api_keys
      SET is_active = false
      WHERE id = ${newApiKey.id}
    `;
    console.log('   ✅ API key deactivated\n');

    await sql.end();

    return {
      storyId,
      title: storyData.title,
      writerEmail: writerProfile.email
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    await sql.end();
    throw error;
  }
}

// Execute
generateAndPublishStory()
  .then((result) => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });

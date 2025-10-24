#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../src/lib/db/schema.ts';
import { eq, sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const databaseUrl = process.env.POSTGRES_URL;
if (!databaseUrl) {
  console.error('POSTGRES_URL is not set');
  process.exit(1);
}

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient, { schema });

const API_URL = 'http://localhost:3000';

async function generateStory() {
  console.log('🚀 Generating new story...');

  const userId = 'woCkBHCnm1k6k7E3cK7rV'; // jong95@gmail.com user ID

  try {
    // Call the API to generate a story
    const response = await fetch(`${API_URL}/api/stories/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Write a science fiction story about a space explorer who discovers an ancient alien artifact on a distant moon that grants the power to see alternate realities.',
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Read the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let storyId = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data && data !== '[DONE]') {
            try {
              const json = JSON.parse(data);
              if (json.storyId) {
                storyId = json.storyId;
                console.log(`📝 Story ID: ${storyId}`);
              }
              if (json.phase) {
                console.log(`📊 Phase: ${json.phase}`);
              }
              if (json.message) {
                console.log(`💬 ${json.message}`);
              }
            } catch (e) {
              // Ignore JSON parse errors for partial chunks
            }
          }
        }
      }
    }

    return storyId;
  } catch (error) {
    console.error('❌ Error generating story:', error);
    throw error;
  }
}

async function verifyChapterIdsInParts(storyId) {
  console.log('\n🔍 Verifying chapter IDs in parts...');

  try {
    // Get all parts for the story
    const parts = await db
      .select()
      .from(schema.parts)
      .where(eq(schema.parts.storyId, storyId))
      .orderBy(schema.parts.orderIndex);

    if (parts.length === 0) {
      console.log('❌ No parts found for story');
      return false;
    }

    let allGood = true;

    for (const part of parts) {
      console.log(`\n📦 Part: ${part.title}`);
      console.log(`   ID: ${part.id}`);
      console.log(`   Chapter IDs: ${JSON.stringify(part.chapterIds)}`);

      if (!part.chapterIds || part.chapterIds.length === 0) {
        console.log('   ❌ No chapter IDs found!');
        allGood = false;
      } else {
        console.log(`   ✅ Has ${part.chapterIds.length} chapter(s)`);

        // Verify chapters exist
        const chapters = await db
          .select()
          .from(schema.chapters)
          .where(eq(schema.chapters.partId, part.id))
          .orderBy(schema.chapters.orderIndex);

        for (const chapter of chapters) {
          console.log(`      📖 Chapter: ${chapter.title} (${chapter.id})`);
        }

        if (chapters.length !== part.chapterIds.length) {
          console.log(`   ⚠️  Expected ${part.chapterIds.length} chapters but found ${chapters.length}`);
          allGood = false;
        }
      }
    }

    return allGood;
  } catch (error) {
    console.error('❌ Error verifying parts:', error);
    return false;
  }
}

async function verifyStoryStructure(storyId) {
  console.log('\n📊 Verifying complete story structure...');

  try {
    // Get story
    const stories = await db
      .select()
      .from(schema.stories)
      .where(eq(schema.stories.id, storyId));

    if (stories.length === 0) {
      console.log('❌ Story not found');
      return;
    }

    const story = stories[0];
    console.log(`\n📚 Story: ${story.title}`);
    console.log(`   Status: ${story.status}`);

    // Count all elements
    const partsCount = await db
      .select({ count: sql`count(*)::int` })
      .from(schema.parts)
      .where(eq(schema.parts.storyId, storyId));

    const chaptersCount = await db
      .select({ count: sql`count(*)::int` })
      .from(schema.chapters)
      .where(eq(schema.chapters.storyId, storyId));

    const charactersCount = await db
      .select({ count: sql`count(*)::int` })
      .from(schema.characters)
      .where(eq(schema.characters.storyId, storyId));

    const settingsCount = await db
      .select({ count: sql`count(*)::int` })
      .from(schema.settings)
      .where(eq(schema.settings.storyId, storyId));

    // Count scenes via chapters
    const chapterIds = await db
      .select({ id: schema.chapters.id })
      .from(schema.chapters)
      .where(eq(schema.chapters.storyId, storyId));

    let scenesCount = 0;
    if (chapterIds.length > 0) {
      const scenes = await db
        .select({ count: sql`count(*)::int` })
        .from(schema.scenes)
        .where(sql`${schema.scenes.chapterId} = ANY(${chapterIds.map(c => c.id)})`);
      scenesCount = scenes[0]?.count || 0;
    }

    console.log(`\n📈 Story Statistics:`);
    console.log(`   Parts: ${partsCount[0]?.count || 0}`);
    console.log(`   Chapters: ${chaptersCount[0]?.count || 0}`);
    console.log(`   Scenes: ${scenesCount}`);
    console.log(`   Characters: ${charactersCount[0]?.count || 0}`);
    console.log(`   Settings: ${settingsCount[0]?.count || 0}`);

  } catch (error) {
    console.error('❌ Error verifying story structure:', error);
  }
}

// Main execution
async function main() {
  try {
    console.log('🌟 Starting story generation and verification...\n');

    // Generate a new story
    const storyId = await generateStory();

    if (!storyId) {
      console.log('❌ Failed to generate story');
      process.exit(1);
    }

    // Wait a bit for all database operations to complete
    console.log('\n⏳ Waiting for database operations to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify chapter IDs are in parts
    const verified = await verifyChapterIdsInParts(storyId);

    // Show complete story structure
    await verifyStoryStructure(storyId);

    if (verified) {
      console.log('\n✅ SUCCESS: All parts have chapter IDs properly set!');
    } else {
      console.log('\n❌ FAILURE: Some parts are missing chapter IDs');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
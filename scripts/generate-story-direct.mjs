#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

// Import after env vars are loaded
const { generateCompleteHNS } = await import('../src/lib/ai/hns-generator.ts');
const schema = await import('../src/lib/db/schema.ts');

const databaseUrl = process.env.POSTGRES_URL;
if (!databaseUrl) {
  console.error('POSTGRES_URL is not set');
  process.exit(1);
}

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient, { schema });

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

async function main() {
  try {
    console.log('🌟 Starting direct HNS story generation...\n');

    const prompt = 'Write a science fiction story about a space explorer who discovers an ancient alien artifact on a distant moon that grants the power to see alternate realities.';
    const userId = 'woCkBHCnm1k6k7E3cK7rV'; // jong95@gmail.com user ID
    const language = 'English';

    console.log(`📝 Prompt: ${prompt}`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`🌐 Language: ${language}\n`);

    // Generate complete HNS story
    console.log('🚀 Generating story with HNS...');
    const hnsDocument = await generateCompleteHNS(
      prompt,
      language,
      userId,
      undefined, // Let it generate a new story ID
      (phase, data) => {
        console.log(`\n📊 ${phase}: ${data.message || ''}`);
        if (data.story) {
          console.log(`   Story ID: ${data.story.story_id}`);
        }
      }
    );

    const storyId = hnsDocument.story.story_id;
    console.log(`\n✅ Story generated successfully!`);
    console.log(`   Story ID: ${storyId}`);
    console.log(`   Title: ${hnsDocument.story.story_title}`);

    // Wait for database operations to complete
    console.log('\n⏳ Waiting for database operations to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify chapter IDs in parts
    const verified = await verifyChapterIdsInParts(storyId);

    // Show summary
    console.log('\n📊 Story Structure Summary:');
    console.log(`   Parts: ${hnsDocument.parts.length}`);
    console.log(`   Chapters: ${hnsDocument.chapters.length}`);
    console.log(`   Scenes: ${hnsDocument.scenes.length}`);
    console.log(`   Characters: ${hnsDocument.characters.length}`);
    console.log(`   Settings: ${hnsDocument.settings.length}`);

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
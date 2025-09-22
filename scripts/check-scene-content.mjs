#!/usr/bin/env node

// Check scene content in hnsData
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const POSTGRES_URL = process.env.POSTGRES_URL;
const sql = postgres(POSTGRES_URL, { prepare: false });

async function checkSceneContent() {
  console.log('🔍 Checking Scene Content in HNS Data');
  console.log('====================================');

  try {
    // Get the latest story
    const stories = await sql`SELECT id, title FROM stories ORDER BY created_at DESC LIMIT 1`;

    if (stories.length === 0) {
      console.log('❌ No stories found');
      return;
    }

    const story = stories[0];
    console.log(`\n📖 Story: ${story.title} (${story.id})`);

    // Get scenes for this story
    const scenes = await sql`
      SELECT s.id, s.title, s.content, s.hns_data, c.title as chapter_title
      FROM scenes s
      JOIN chapters c ON s.chapter_id = c.id
      WHERE c.story_id = ${story.id}
      ORDER BY s.order_index
      LIMIT 5
    `;

    console.log(`\n🎬 Found ${scenes.length} scenes`);

    for (const scene of scenes) {
      console.log(`\n🔎 Scene: ${scene.title} (Chapter: ${scene.chapter_title})`);

      console.log(`📝 Content field: ${scene.content ? `${scene.content.substring(0, 100)}...` : 'EMPTY!'}`);

      if (scene.hns_data) {
        try {
          const hnsData = typeof scene.hns_data === 'string' ? JSON.parse(scene.hns_data) : scene.hns_data;
          console.log(`📋 HNS Data keys: ${Object.keys(hnsData).join(', ')}`);

          if (hnsData.content) {
            console.log(`📄 HNS content: ${hnsData.content.substring(0, 100)}...`);
          } else {
            console.log('❌ NO CONTENT in HNS Data!');
          }

          // Check for other important scene data
          const importantKeys = ['scene_title', 'summary', 'goal', 'conflict', 'outcome', 'pov_character_id', 'setting_id'];
          const presentKeys = importantKeys.filter(key => hnsData[key]);
          const missingKeys = importantKeys.filter(key => !hnsData[key]);

          if (presentKeys.length > 0) {
            console.log(`✅ Present: ${presentKeys.join(', ')}`);
          }
          if (missingKeys.length > 0) {
            console.log(`⚠️  Missing: ${missingKeys.join(', ')}`);
          }
        } catch (error) {
          console.log(`❌ Error parsing HNS data: ${error.message}`);
        }
      } else {
        console.log('❌ NO HNS Data!');
      }

      console.log('---');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

checkSceneContent().catch(console.error);
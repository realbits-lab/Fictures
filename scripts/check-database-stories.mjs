#!/usr/bin/env node

/**
 * Check Database Stories
 * Direct database query to see what stories exist
 */

import postgres from 'postgres';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function checkDatabase() {
  try {
    console.log('\n🔍 Checking database for stories...\n');

    // Get all stories with user info
    const stories = await sql`
      SELECT
        s.id,
        s.title,
        s.author_id,
        u.email as user_email,
        s.genre,
        s.status,
        (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) as chapter_count,
        (SELECT COUNT(*) FROM scenes sc
         JOIN chapters ch ON sc.chapter_id = ch.id
         WHERE ch.story_id = s.id) as scene_count
      FROM stories s
      LEFT JOIN users u ON s.author_id = u.id
      ORDER BY s.created_at DESC
      LIMIT 20
    `;

    console.log(`Found ${stories.length} stories:\n`);

    for (const story of stories) {
      console.log(`📚 "${story.title}"`);
      console.log(`   ID: ${story.id}`);
      console.log(`   Author: ${story.user_email} (${story.author_id})`);
      console.log(`   Genre: ${story.genre || 'N/A'}`);
      console.log(`   Status: ${story.status}`);
      console.log(`   Chapters: ${story.chapter_count}, Scenes: ${story.scene_count}`);
      console.log('');
    }

    // Search for "Glitch" or "Digital Ghost" scenes
    console.log('🔍 Searching for "Glitch" or "Digital Ghost" scenes...\n');

    const scenes = await sql`
      SELECT
        sc.id as scene_id,
        sc.title as scene_title,
        ch.title as chapter_title,
        s.title as story_title,
        s.id as story_id,
        u.email as user_email
      FROM scenes sc
      JOIN chapters ch ON sc.chapter_id = ch.id
      JOIN stories s ON ch.story_id = s.id
      LEFT JOIN users u ON s.author_id = u.id
      WHERE
        LOWER(sc.title) LIKE '%glitch%'
        OR LOWER(sc.title) LIKE '%digital%'
        OR LOWER(s.title) LIKE '%digital%'
      LIMIT 20
    `;

    console.log(`Found ${scenes.length} matching scenes:\n`);

    for (const scene of scenes) {
      console.log(`✅ Scene: "${scene.scene_title}"`);
      console.log(`   Story: "${scene.story_title}"`);
      console.log(`   Chapter: "${scene.chapter_title}"`);
      console.log(`   Scene ID: ${scene.scene_id}`);
      console.log(`   Story ID: ${scene.story_id}`);
      console.log(`   User: ${scene.user_email}`);
      console.log('');
    }

    await sql.end();

  } catch (error) {
    console.error('❌ Database error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

checkDatabase();

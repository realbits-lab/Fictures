#!/usr/bin/env node

import { config } from 'dotenv';
import postgres from 'postgres';
import fs from 'fs';

// Load environment variables
config({ path: '.env.local' });

const client = postgres(process.env.POSTGRES_URL, { prepare: false });

async function checkData() {
  try {
    console.log('🔍 Checking Neon database for story data...\n');

    // Check stories created by manager user
    const stories = await client`
      SELECT
        s.id,
        s.title,
        s.genre,
        s.status,
        s.target_word_count,
        s.current_word_count,
        s.created_at,
        u.email as author_email
      FROM stories s
      JOIN users u ON s.author_id = u.id
      WHERE u.email = 'manager@fictures.xyz'
      ORDER BY s.created_at DESC
    `;

    console.log('📚 Stories created by manager@fictures.xyz:');
    console.log('========================================');
    stories.forEach(story => {
      console.log(`ID: ${story.id}`);
      console.log(`Title: ${story.title}`);
      console.log(`Genre: ${story.genre || 'N/A'}`);
      console.log(`Status: ${story.status}`);
      console.log(`Target Words: ${story.target_word_count || 'N/A'}`);
      console.log(`Current Words: ${story.current_word_count || 0}`);
      console.log(`Created: ${story.created_at}`);
      console.log('---');
    });

    if (stories.length > 0) {
      // Check parts for the stories
      const parts = await client`
        SELECT
          p.id,
          p.title,
          p.order_index,
          p.status,
          p.target_word_count,
          p.story_id
        FROM parts p
        WHERE p.story_id IN (
          SELECT id FROM stories
          WHERE author_id = (SELECT id FROM users WHERE email = 'manager@fictures.xyz')
        )
        ORDER BY p.story_id, p.order_index
      `;

      console.log('\n📑 Story Parts:');
      console.log('===============');
      parts.forEach(part => {
        console.log(`Part ${part.order_index}: ${part.title}`);
        console.log(`  Story ID: ${part.story_id}`);
        console.log(`  Status: ${part.status}`);
        console.log(`  Target Words: ${part.target_word_count || 'N/A'}`);
      });

      // Check characters
      const characters = await client`
        SELECT
          c.id,
          c.name,
          c.role,
          c.story_id
        FROM characters c
        WHERE c.story_id IN (
          SELECT id FROM stories
          WHERE author_id = (SELECT id FROM users WHERE email = 'manager@fictures.xyz')
        )
      `;

      console.log('\n👥 Characters:');
      console.log('==============');
      characters.forEach(char => {
        console.log(`${char.name} (${char.role || 'Unknown role'})`);
        console.log(`  Story ID: ${char.story_id}`);
      });

      // Check chapters
      const chapters = await client`
        SELECT
          ch.id,
          ch.title,
          ch.order_index,
          ch.story_id,
          ch.part_id
        FROM chapters ch
        WHERE ch.story_id IN (
          SELECT id FROM stories
          WHERE author_id = (SELECT id FROM users WHERE email = 'manager@fictures.xyz')
        )
        ORDER BY ch.story_id, ch.order_index
        LIMIT 10
      `;

      console.log('\n📖 Chapters (first 10):');
      console.log('========================');
      chapters.forEach(chapter => {
        console.log(`Chapter ${chapter.order_index}: ${chapter.title || 'Untitled'}`);
        console.log(`  Story ID: ${chapter.story_id}`);
        console.log(`  Part ID: ${chapter.part_id || 'N/A'}`);
      });
    }

    // Check API key usage
    const apiKeys = await client`
      SELECT
        ak.key_prefix,
        ak.name,
        ak.last_used_at,
        ak.is_active
      FROM api_keys ak
      WHERE ak.user_id = (SELECT id FROM users WHERE email = 'manager@fictures.xyz')
    `;

    console.log('\n🔑 API Key Status:');
    console.log('==================');
    apiKeys.forEach(key => {
      console.log(`Key: ${key.key_prefix}...`);
      console.log(`Name: ${key.name}`);
      console.log(`Active: ${key.is_active}`);
      console.log(`Last Used: ${key.last_used_at || 'Never'}`);
    });

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error);
    await client.end();
    process.exit(1);
  }
}

checkData();
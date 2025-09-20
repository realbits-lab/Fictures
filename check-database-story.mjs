#!/usr/bin/env node

/**
 * Check what's actually stored in the database for the story
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { stories } from './src/lib/db/schema.js';
import { eq } from 'drizzle-orm';

const client = postgres(process.env.POSTGRES_URL, { prepare: false });
const db = drizzle(client);

async function checkStoryData() {
  console.log('🔍 Checking story data in database...\n');

  try {
    const storyId = 'vKuq7d7oVKDi3pCW5Wllf';

    const result = await db.select().from(stories).where(eq(stories.id, storyId));

    if (result.length === 0) {
      console.log('❌ Story not found in database');
      return;
    }

    const story = result[0];
    console.log('📊 Story Data Retrieved:');
    console.log('  • ID:', story.id);
    console.log('  • Title:', story.title);
    console.log('  • Created:', story.createdAt);
    console.log('  • Updated:', story.updatedAt);
    console.log('  • Story Data Length:', story.storyData ? JSON.stringify(story.storyData).length : 'null');

    if (story.storyData) {
      const data = story.storyData;
      console.log('\n📋 Story Content Analysis:');

      // Check chars
      if (data.chars && typeof data.chars === 'object') {
        const charCount = Object.keys(data.chars).length;
        console.log(`  • Characters: ${charCount} defined`);
        if (charCount > 0) {
          console.log('    Character keys:', Object.keys(data.chars).join(', '));
        }
      } else {
        console.log('  • Characters: Empty or undefined');
      }

      // Check parts
      if (data.parts && Array.isArray(data.parts)) {
        console.log(`  • Parts: ${data.parts.length} defined`);
        if (data.parts.length > 0) {
          console.log('    Part titles:', data.parts.map(p => p.title || 'Untitled').join(', '));
        }
      } else {
        console.log('  • Parts: Empty or undefined');
      }

      // Check serial
      if (data.serial && typeof data.serial === 'object') {
        const serialKeys = Object.keys(data.serial).length;
        console.log(`  • Serial: ${serialKeys} properties defined`);
        if (serialKeys > 0) {
          console.log('    Serial properties:', Object.keys(data.serial).join(', '));
        }
      } else {
        console.log('  • Serial: Empty or undefined');
      }

      // Check hooks
      if (data.hooks && typeof data.hooks === 'object') {
        const hooksKeys = Object.keys(data.hooks).length;
        console.log(`  • Hooks: ${hooksKeys} properties defined`);
        if (hooksKeys > 0) {
          console.log('    Hook properties:', Object.keys(data.hooks).join(', '));
        }
      } else {
        console.log('  • Hooks: Empty or undefined');
      }

      // Show first 500 chars of raw data
      console.log('\n📄 Raw Story Data (first 500 chars):');
      console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
    } else {
      console.log('\n❌ No story data found in database');
    }

  } catch (error) {
    console.error('❌ Database query failed:', error.message);
  }
}

checkStoryData();
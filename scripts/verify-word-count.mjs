#!/usr/bin/env node

/**
 * Verify Word Count Update
 *
 * This script verifies that the currentWordCount field in stories table
 * is correctly calculated from scene word counts after generation.
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/verify-word-count.mjs [STORY_ID]
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

// Initialize database
const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql);

const storyId = process.argv[2];

if (!storyId) {
  console.error('❌ Usage: node verify-word-count.mjs STORY_ID');
  process.exit(1);
}

console.log(`🔍 Verifying word count for story: ${storyId}\n`);

try {
  // Get story info
  const storyResult = await sql`
    SELECT id, title, current_word_count, target_word_count
    FROM stories
    WHERE id = ${storyId}
  `;

  if (storyResult.length === 0) {
    console.error('❌ Story not found');
    process.exit(1);
  }

  const story = storyResult[0];

  // Get all scenes for this story
  const scenesResult = await sql`
    SELECT id, title, word_count
    FROM scenes
    WHERE story_id = ${storyId}
    ORDER BY order_index
  `;

  console.log('📊 Story Information:');
  console.log(`   Title: ${story.title}`);
  console.log(`   Story Word Count (DB): ${story.current_word_count || 0}`);
  console.log(`   Target Word Count: ${story.target_word_count || 0}\n`);

  console.log(`📝 Scenes (${scenesResult.length} total):`);

  let totalCalculated = 0;
  scenesResult.forEach((scene, index) => {
    const wordCount = scene.word_count || 0;
    totalCalculated += wordCount;
    console.log(`   ${index + 1}. ${scene.title}: ${wordCount} words`);
  });

  console.log(`\n📈 Verification:`);
  console.log(`   Calculated Total: ${totalCalculated} words`);
  console.log(`   Database Value:   ${story.current_word_count || 0} words`);

  const match = totalCalculated === (story.current_word_count || 0);

  if (match) {
    console.log(`   ✅ PASS - Word counts match!`);
  } else {
    console.log(`   ❌ FAIL - Word counts don't match!`);
    console.log(`   Difference: ${Math.abs(totalCalculated - (story.current_word_count || 0))} words`);
  }

  process.exit(match ? 0 : 1);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

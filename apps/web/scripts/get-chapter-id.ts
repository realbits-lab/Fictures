#!/usr/bin/env tsx

/**
 * Get Chapter ID for Generated Story
 *
 * Queries the database to find the chapter ID for a specific story.
 * Used when the API response doesn't include firstChapterId.
 *
 * Usage:
 *   pnpm dotenv -e .env.local -- pnpm exec tsx scripts/get-chapter-id.ts
 */

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

const STORY_ID = 'story_ZDbV9uTKiwJiuo-9';

async function getChapterId() {
  console.log('');
  console.log('='.repeat(80));
  console.log('QUERY CHAPTER ID');
  console.log('='.repeat(80));
  console.log(`Story ID: ${STORY_ID}`);
  console.log('');

  try {
    // Use raw SQL query to avoid any schema import issues
    const result = await db.execute(
      sql`SELECT id, title FROM chapters WHERE story_id = ${STORY_ID} LIMIT 1`
    );

    if (result.rows.length > 0) {
      const chapter = result.rows[0] as { id: string; title: string };
      console.log('✓ Chapter found!');
      console.log('');
      console.log(`  Chapter ID:    ${chapter.id}`);
      console.log(`  Chapter Title: ${chapter.title}`);
      console.log('');
      console.log('='.repeat(80));
      console.log('NEXT STEP: RUN CHAPTER EVALUATION');
      console.log('='.repeat(80));
      console.log('');
      console.log('curl -X POST http://localhost:3000/api/evaluation/chapter \\');
      console.log('  -H "Content-Type: application/json" \\');
      console.log(`  -d '{"chapterId": "${chapter.id}", "evaluationMode": "standard"}' | jq`);
      console.log('');
    } else {
      console.log('⚠️  No chapters found for this story.');
      console.log('');
      console.log('This could mean:');
      console.log('  1. Story generation is still in progress');
      console.log('  2. Story was created but chapters were not generated');
      console.log('  3. Database transaction has not yet committed');
      console.log('');
    }
  } catch (error) {
    console.error('');
    console.error('❌ Database query failed:');
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

getChapterId();

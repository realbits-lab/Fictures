#!/usr/bin/env tsx

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function findChapters() {
  const result = await db.execute(
    sql`SELECT s.id as story_id, s.title as story_title, c.id as chapter_id, c.title as chapter_title
        FROM stories s
        INNER JOIN chapters c ON s.id = c.story_id
        LIMIT 5`
  );

  console.log(JSON.stringify(result.rows, null, 2));
}

findChapters();

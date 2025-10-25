#!/usr/bin/env node

/**
 * Publish Story Script
 *
 * Publishes a story by updating its status and isPublic fields in the database
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

// Define stories table schema inline
const stories = pgTable('stories', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  genre: text('genre'),
  status: text('status'),
  isPublic: boolean('is_public').default(false),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Load environment variables
config({ path: '.env.local' });

const storyId = process.argv[2];

if (!storyId) {
  console.error('Usage: node scripts/publish-story.mjs <story-id>');
  process.exit(1);
}

// Setup database connection
const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql);

console.log(`📤 Publishing story: ${storyId}\n`);

try {
  const result = await db
    .update(stories)
    .set({
      status: 'published',
      isPublic: true,
      updatedAt: new Date()
    })
    .where(eq(stories.id, storyId))
    .returning();

  if (result.length === 0) {
    console.error('❌ Story not found');
    process.exit(1);
  }

  const story = result[0];

  console.log('✅ Story published successfully!\n');
  console.log('**Story Details:**');
  console.log(`- Title: ${story.title}`);
  console.log(`- Genre: ${story.genre}`);
  console.log(`- Status: 📢 Published`);
  console.log(`- Now visible to the community\n`);
  console.log('**Navigation:**');
  console.log(`- Community page: http://localhost:3000/community/story/${storyId}`);
  console.log(`- Edit at: http://localhost:3000/writing/${storyId}`);
  console.log(`- Read at: http://localhost:3000/reading/${storyId}`);

  process.exit(0);
} catch (error) {
  console.error('❌ Error publishing story:', error.message);
  process.exit(1);
}

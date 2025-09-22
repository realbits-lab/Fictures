#!/usr/bin/env node

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../src/lib/db/schema.js';

// Load environment variables
config({ path: '.env.local' });

async function cleanupDatabase() {
  try {
    console.log('🗑️  Starting database cleanup...\n');

    // Create database connection
    const sql = neon(process.env.POSTGRES_URL);
    const db = drizzle(sql, { schema });

    // Get current counts
    console.log('📊 Current database state:');
    const storiesCount = await db.select().from(schema.stories);
    const charactersCount = await db.select().from(schema.characters);
    const settingsCount = await db.select().from(schema.settings);

    console.log(`   Stories: ${storiesCount.length}`);
    console.log(`   Characters: ${charactersCount.length}`);
    console.log(`   Settings: ${settingsCount.length}`);

    if (storiesCount.length > 0) {
      console.log('\n📚 Stories to delete:');
      storiesCount.forEach(story => {
        console.log(`   - ${story.title} (${story.id})`);
      });

      // Delete all stories
      console.log('\n🔥 Deleting all stories...');
      await db.delete(schema.stories);
      console.log('✅ All stories deleted');

      // Verify deletion
      const afterCount = await db.select().from(schema.stories);
      console.log(`\n📊 Stories remaining: ${afterCount.length}`);
    } else {
      console.log('\n✅ No stories to delete');
    }

    console.log('\n✅ Database cleanup completed!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupDatabase().then(() => {
  process.exit(0);
});
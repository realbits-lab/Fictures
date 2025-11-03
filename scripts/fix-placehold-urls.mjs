#!/usr/bin/env node

/**
 * Fix Placehold.co URLs in Database
 *
 * Replaces all placehold.co URLs with local placeholder API URLs
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

// Load environment variables
config({ path: '.env.local' });

const sqlClient = neon(process.env.POSTGRES_URL);
const db = drizzle(sqlClient);

async function fixPlaceholdUrls() {
  console.log('🔧 Fixing placehold.co URLs in database...\n');

  try {
    // Fix stories table
    console.log('📚 Updating stories...');
    const storiesResult = await db.execute(sql`
      UPDATE stories
      SET image_url = REPLACE(image_url, 'https://placehold.co/', 'http://localhost:3000/api/placeholder?width=1792&height=1024&text=')
      WHERE image_url LIKE '%placehold.co%'
    `);
    console.log(`✅ Updated ${storiesResult.rowCount || 0} story images\n`);

    // Fix scenes table (two-step replacement)
    console.log('🎬 Updating scenes...');

    // First, replace full URL with query params
    const scenesResult1 = await db.execute(sql`
      UPDATE scenes
      SET image_url = REPLACE(image_url, 'https://placehold.co/1344x768?text=', 'http://localhost:3000/api/placeholder?width=1344&height=768&text=')
      WHERE image_url LIKE '%placehold.co/1344x768?text=%'
    `);

    // Then, replace base URL for any remaining
    const scenesResult2 = await db.execute(sql`
      UPDATE scenes
      SET image_url = REPLACE(image_url, 'https://placehold.co/', 'http://localhost:3000/api/placeholder?width=1344&height=768&text=')
      WHERE image_url LIKE '%placehold.co%'
    `);

    const scenesTotal = (scenesResult1.rowCount || 0) + (scenesResult2.rowCount || 0);
    console.log(`✅ Updated ${scenesTotal} scene images\n`);

    // Fix characters table
    console.log('👥 Updating characters...');
    const charactersResult = await db.execute(sql`
      UPDATE characters
      SET image_url = REPLACE(image_url, 'https://placehold.co/', 'http://localhost:3000/api/placeholder?width=1024&height=1024&text=')
      WHERE image_url LIKE '%placehold.co%'
    `);
    console.log(`✅ Updated ${charactersResult.rowCount || 0} character images\n`);

    // Fix settings table
    console.log('🏛️  Updating settings...');
    const settingsResult = await db.execute(sql`
      UPDATE settings
      SET image_url = REPLACE(image_url, 'https://placehold.co/', 'http://localhost:3000/api/placeholder?width=1792&height=1024&text=')
      WHERE image_url LIKE '%placehold.co%'
    `);
    console.log(`✅ Updated ${settingsResult.rowCount || 0} setting images\n`);

    console.log('✨ All placehold.co URLs have been fixed!');
    console.log('\n📊 Summary:');
    console.log(`  - Stories: ${storiesResult.rowCount || 0}`);
    console.log(`  - Scenes: ${scenesTotal}`);
    console.log(`  - Characters: ${charactersResult.rowCount || 0}`);
    console.log(`  - Settings: ${settingsResult.rowCount || 0}`);
    console.log(`  - Total: ${(storiesResult.rowCount || 0) + scenesTotal + (charactersResult.rowCount || 0) + (settingsResult.rowCount || 0)}`);

  } catch (error) {
    console.error('\n❌ Error fixing URLs:', error);
    process.exit(1);
  }
}

fixPlaceholdUrls();

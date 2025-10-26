#!/usr/bin/env node

import postgres from 'postgres';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.POSTGRES_URL, { max: 1 });

async function createTable() {
  try {
    console.log('\n🔧 Creating enum types and comic_panels table...\n');

    // Create shot_type enum if it doesn't exist
    console.log('Creating shot_type enum...');
    await sql`
      DO $$ BEGIN
        CREATE TYPE shot_type AS ENUM (
          'establishing_shot',
          'wide_shot',
          'medium_shot',
          'close_up',
          'extreme_close_up',
          'over_shoulder',
          'dutch_angle'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Create sfx_emphasis enum if it doesn't exist
    console.log('Creating sfx_emphasis enum...');
    await sql`
      DO $$ BEGIN
        CREATE TYPE sfx_emphasis AS ENUM (
          'normal',
          'large',
          'dramatic'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Create comic_panels table
    console.log('Creating comic_panels table...');
    await sql`
      CREATE TABLE IF NOT EXISTS comic_panels (
        id TEXT PRIMARY KEY,
        scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
        panel_number INTEGER NOT NULL,
        shot_type shot_type NOT NULL,
        image_url TEXT,
        image_variants JSON,
        dialogue JSON,
        sfx JSON,
        gutter_after INTEGER,
        metadata JSON,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    console.log('✅ All objects created successfully!');

    await sql.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

createTable();

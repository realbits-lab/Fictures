#!/usr/bin/env node

import dotenv from 'dotenv';
import postgres from 'postgres';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL not found in .env.local');
  process.exit(1);
}

async function applyHNSMigration() {
  console.log('🚀 Applying HNS fields migration...\n');

  const client = postgres(POSTGRES_URL, { prepare: false });

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'src', 'lib', 'db', 'migrations', 'add_hns_fields.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');

    console.log('📄 Loaded migration file: add_hns_fields.sql');

    // Execute the entire migration as one transaction
    console.log('🔄 Executing migration...\n');

    await client.begin(async sql => {
      // Execute the entire SQL file
      await sql.unsafe(sqlContent);
    });

    console.log('✅ Migration applied successfully!\n');

    // Verify the migration
    console.log('📋 Verifying migration results...\n');

    // Check stories table columns
    const storiesColumns = await client`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'stories'
      AND column_name IN ('premise', 'dramatic_question', 'theme', 'hns_data')
      ORDER BY column_name
    `;

    console.log(`Stories table: ${storiesColumns.length}/4 HNS columns added`);
    if (storiesColumns.length === 4) console.log('   ✅ All columns present');

    // Check parts table columns
    const partsColumns = await client`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'parts'
      AND column_name IN ('structural_role', 'summary', 'key_beats', 'hns_data')
      ORDER BY column_name
    `;

    console.log(`Parts table: ${partsColumns.length}/4 HNS columns added`);
    if (partsColumns.length === 4) console.log('   ✅ All columns present');

    // Check chapters table columns
    const chaptersColumns = await client`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'chapters'
      AND column_name IN ('pacing_goal', 'action_dialogue_ratio', 'chapter_hook', 'hns_data')
      ORDER BY column_name
    `;

    console.log(`Chapters table: ${chaptersColumns.length}/4 HNS columns added`);
    if (chaptersColumns.length === 4) console.log('   ✅ All columns present');

    // Check scenes table columns
    const scenesColumns = await client`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'scenes'
      AND column_name IN ('pov_character_id', 'setting_id', 'narrative_voice', 'summary', 'entry_hook', 'emotional_shift', 'hns_data')
      ORDER BY column_name
    `;

    console.log(`Scenes table: ${scenesColumns.length}/7 HNS columns added`);
    if (scenesColumns.length === 7) console.log('   ✅ All columns present');

    // Check characters table columns
    const charactersColumns = await client`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'characters'
      AND column_name IN ('role', 'archetype', 'summary', 'storyline', 'personality', 'backstory', 'motivations', 'voice', 'physical_description', 'visual_reference_id', 'hns_data')
      ORDER BY column_name
    `;

    console.log(`Characters table: ${charactersColumns.length}/11 HNS columns added`);
    if (charactersColumns.length === 11) console.log('   ✅ All columns present');

    // Check if settings table exists
    const settingsTable = await client`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'settings'
      ) as exists
    `;

    console.log(`Settings table: ${settingsTable[0].exists ? 'Created' : 'Not created'}`);
    if (settingsTable[0].exists) console.log('   ✅ Table exists');

    // Check indexes
    const indexes = await client`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%hns_data'
    `;

    console.log(`\n🔍 GIN Indexes: ${indexes.length} created`);
    if (indexes.length > 0) {
      indexes.forEach(idx => console.log(`   - ${idx.indexname}`));
    }

    await client.end();
    console.log('\n✨ HNS migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message || error);
    console.error('\nError details:', error);
    await client.end();
    process.exit(1);
  }
}

// Run the migration
console.log('📦 HNS Fields Migration');
console.log('=======================\n');
applyHNSMigration();
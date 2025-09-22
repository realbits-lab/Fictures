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

async function migrateHNSFields() {
  console.log('🚀 Starting HNS fields migration...\n');

  const client = postgres(POSTGRES_URL, { prepare: false });

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'src', 'lib', 'db', 'migrations', 'add_hns_fields.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');

    console.log('📄 Loaded migration file: add_hns_fields.sql');

    // Split SQL content into logical sections
    const sections = sqlContent.split(/\n--/);

    // Process statements in correct order
    const statements = [];

    // First, collect ALTER TABLE and CREATE TABLE statements
    sections.forEach(section => {
      if (section.includes('ALTER TABLE') || section.includes('CREATE TABLE')) {
        const sectionStatements = section
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        statements.push(...sectionStatements);
      }
    });

    // Then collect CREATE INDEX statements
    sections.forEach(section => {
      if (section.includes('CREATE INDEX')) {
        const sectionStatements = section
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--') && s.includes('CREATE INDEX'));
        statements.push(...sectionStatements);
      }
    });

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const firstLine = statement.split('\n')[0];

      console.log(`[${i + 1}/${statements.length}] Executing: ${firstLine}...`);

      try {
        await client.unsafe(statement);
        console.log(`   ✅ Success`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⏭️  Already exists (skipped)`);
        } else {
          console.error(`   ❌ Failed: ${error.message}`);
          throw error;
        }
      }
    }

    console.log('\n📋 Verifying migration...\n');

    // Verify the migration
    const verifications = [
      { table: 'stories', columns: ['premise', 'dramatic_question', 'theme', 'hns_data'] },
      { table: 'parts', columns: ['structural_role', 'summary', 'key_beats', 'hns_data'] },
      { table: 'chapters', columns: ['pacing_goal', 'action_dialogue_ratio', 'chapter_hook', 'hns_data'] },
      { table: 'scenes', columns: ['pov_character_id', 'setting_id', 'narrative_voice', 'emotional_shift', 'hns_data'] },
      { table: 'characters', columns: ['role', 'archetype', 'storyline', 'personality', 'voice', 'hns_data'] },
    ];

    for (const { table, columns } of verifications) {
      console.log(`Checking table: ${table}`);

      const tableColumns = await client`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ANY(${columns})
        ORDER BY ordinal_position
      `;

      const foundColumns = tableColumns.map(col => col.column_name);
      const missingColumns = columns.filter(col => !foundColumns.includes(col));

      if (missingColumns.length === 0) {
        console.log(`   ✅ All HNS columns present (${columns.length} columns)`);
      } else {
        console.log(`   ⚠️  Missing columns: ${missingColumns.join(', ')}`);
      }
    }

    // Check if settings table exists
    const settingsTable = await client`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'settings'
      ) as exists
    `;

    if (settingsTable[0].exists) {
      console.log('\nChecking table: settings');
      console.log('   ✅ Settings table exists');
    } else {
      console.log('\nChecking table: settings');
      console.log('   ❌ Settings table not found');
    }

    // Check indexes
    console.log('\n🔍 Checking indexes...\n');

    const indexes = await client`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%hns_data'
    `;

    if (indexes.length > 0) {
      console.log(`   ✅ Found ${indexes.length} HNS data indexes`);
      indexes.forEach(idx => console.log(`      - ${idx.indexname}`));
    } else {
      console.log('   ⚠️  No HNS indexes found');
    }

    await client.end();
    console.log('\n✨ HNS migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message || error);
    await client.end();
    process.exit(1);
  }
}

// Run the migration
console.log('📦 HNS Fields Migration Tool');
console.log('============================\n');
migrateHNSFields();
#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read POSTGRES_URL from environment
const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ POSTGRES_URL environment variable not set');
  process.exit(1);
}

console.log('🔌 Connecting to database...');

// Create postgres client
const client = postgres(connectionString, { max: 1 });

try {
  // Read migration SQL
  const migrationPath = path.join(
    __dirname,
    '..',
    'drizzle',
    '0029_add_comic_status_fields.sql'
  );

  console.log('📄 Reading migration file:', migrationPath);
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('⚡ Applying migration...');
  await client.unsafe(migrationSQL);

  console.log('✅ Migration applied successfully!');

  // Verify the changes
  console.log('\n🔍 Verifying changes...');

  const enumCheck = await client`
    SELECT enum_range(NULL::comic_status) as values
  `;
  console.log('✓ comic_status enum:', enumCheck[0].values);

  const columnCheck = await client`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'scenes'
      AND column_name LIKE 'comic_%'
    ORDER BY column_name
  `;
  console.log('\n✓ Comic columns added:');
  columnCheck.forEach((col) => {
    console.log(`  - ${col.column_name} (${col.data_type})`);
  });

  const backfillCheck = await client`
    SELECT
      COUNT(*) FILTER (WHERE comic_status = 'published') as published_count,
      COUNT(*) as total_scenes
    FROM scenes
  `;
  console.log('\n✓ Backfill results:');
  console.log(`  - Scenes with published comics: ${backfillCheck[0].published_count}`);
  console.log(`  - Total scenes: ${backfillCheck[0].total_scenes}`);

  console.log('\n🎉 Comic status migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  await client.end();
}

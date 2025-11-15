#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read migration file
const migrationPath = join(__dirname, '../drizzle/migrations/unify_status_enum.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

// Connect to database
const databaseUrl = process.env.DATABASE_URL_UNPOOLED;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL_UNPOOLED environment variable is required');
  process.exit(1);
}

console.log('📊 Connecting to database...');
const sql = postgres(databaseUrl, { max: 1 });

try {
  console.log('🔄 Running unified status enum migration...\n');

  // Split migration into individual statements
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  for (const statement of statements) {
    // Skip comments
    if (statement.startsWith('COMMENT')) {
      console.log(`💬 ${statement.substring(0, 60)}...`);
      await sql.unsafe(statement);
      continue;
    }

    // Log what we're doing
    if (statement.includes('ALTER TABLE stories')) {
      console.log('✓ Updating stories table...');
    } else if (statement.includes('ALTER TABLE chapters')) {
      console.log('✓ Updating chapters table...');
    } else if (statement.includes('ALTER TABLE scenes')) {
      console.log('✓ Updating scenes table...');
    } else if (statement.includes('DROP TYPE')) {
      console.log('✓ Dropping old enum types...');
    } else if (statement.includes('CREATE TYPE status')) {
      console.log('✓ Creating new status enum...');
    } else if (statement.includes('CREATE INDEX')) {
      console.log('✓ Creating indexes...');
    } else if (statement.includes('DROP INDEX')) {
      console.log('✓ Dropping old indexes...');
    } else if (statement.includes('UPDATE')) {
      console.log('✓ Migrating data...');
    }

    await sql.unsafe(statement);
  }

  console.log('\n✅ Migration completed successfully!');
  console.log('\n📊 Summary:');
  console.log('  - Status enum updated: "draft" | "published"');
  console.log('  - Removed: visibility enum');
  console.log('  - Removed: comic_status enum (old)');
  console.log('  - Removed: chapters.status field');
  console.log('  - Renamed: scenes.visibility → scenes.novel_status');
  console.log('  - Updated: scenes.comic_status to use unified status enum');

} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.error(error);
  process.exit(1);
} finally {
  await sql.end();
}

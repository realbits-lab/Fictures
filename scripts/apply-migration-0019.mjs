import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationSQL = readFileSync(
      join(__dirname, '../drizzle/0019_add_comments_and_likes.sql'),
      'utf-8'
    );

    console.log('Applying migration 0019_add_comments_and_likes...');
    await db.execute(sql.raw(migrationSQL));

    console.log('Migration applied successfully!');
    console.log('Tables created:');
    console.log('  - comments');
    console.log('  - comment_likes');
    console.log('  - story_likes');
    console.log('  - chapter_likes');
    console.log('  - scene_likes');
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();

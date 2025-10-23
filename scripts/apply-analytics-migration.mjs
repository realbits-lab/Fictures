import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sql = neon(process.env.POSTGRES_URL);

async function main() {
  try {
    console.log('Starting analytics tables migration...');

    const migrationPath = path.join(__dirname, '../drizzle/0020_add_analytics_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Applying migration...');

    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      await sql.query(statement);
    }

    console.log('Migration completed successfully!');
    console.log('Analytics tables created:');
    console.log('- analytics_events (with indexes)');
    console.log('- reading_sessions (with indexes)');
    console.log('- story_insights (with indexes)');
    console.log('- recommendation_feedback (with indexes)');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql);

async function addDislikeTables() {
  console.log('Adding dislike tables to database...\n');

  try {
    // Create comment_dislikes table
    console.log('Creating comment_dislikes table...');
    await sql`
      CREATE TABLE IF NOT EXISTS comment_dislikes (
        id TEXT PRIMARY KEY,
        comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT comment_dislike_user_unique UNIQUE (comment_id, user_id)
      );
    `;
    console.log('✓ comment_dislikes table created\n');

    // Create scene_dislikes table
    console.log('Creating scene_dislikes table...');
    await sql`
      CREATE TABLE IF NOT EXISTS scene_dislikes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT scene_dislike_user_unique UNIQUE (user_id, scene_id)
      );
    `;
    console.log('✓ scene_dislikes table created\n');

    // Create indexes for better query performance
    console.log('Creating indexes...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_comment_dislikes_comment_id ON comment_dislikes(comment_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_comment_dislikes_user_id ON comment_dislikes(user_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_scene_dislikes_scene_id ON scene_dislikes(scene_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_scene_dislikes_user_id ON scene_dislikes(user_id);
    `;
    console.log('✓ Indexes created\n');

    console.log('=== Migration Complete ===');
    console.log('✅ comment_dislikes table added');
    console.log('✅ scene_dislikes table added');
    console.log('✅ Indexes created for performance');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

addDislikeTables().catch(console.error);

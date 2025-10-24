import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);

async function addCommentsIndexes() {
  try {
    console.log('Creating indexes for comments table...');

    await client`CREATE INDEX IF NOT EXISTS "comments_story_id_idx" ON "comments"("story_id")`;
    await client`CREATE INDEX IF NOT EXISTS "comments_chapter_id_idx" ON "comments"("chapter_id")`;
    await client`CREATE INDEX IF NOT EXISTS "comments_scene_id_idx" ON "comments"("scene_id")`;
    await client`CREATE INDEX IF NOT EXISTS "comments_parent_comment_id_idx" ON "comments"("parent_comment_id")`;
    await client`CREATE INDEX IF NOT EXISTS "comments_user_id_idx" ON "comments"("user_id")`;
    await client`CREATE INDEX IF NOT EXISTS "comments_created_at_idx" ON "comments"("created_at")`;

    console.log('✅ All comments indexes created successfully!');
    console.log('Indexes created:');
    console.log('  - comments_story_id_idx');
    console.log('  - comments_chapter_id_idx');
    console.log('  - comments_scene_id_idx');
    console.log('  - comments_parent_comment_id_idx');
    console.log('  - comments_user_id_idx');
    console.log('  - comments_created_at_idx');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addCommentsIndexes();

import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);

async function recreateCommentsTable() {
  try {
    console.log('Dropping old comments table...');
    await client`DROP TABLE IF EXISTS comments CASCADE`;
    console.log('✓ Old comments table dropped');

    console.log('Creating new comments table with correct schema...');
    await client`
      CREATE TABLE "comments" (
        "id" text PRIMARY KEY NOT NULL,
        "content" text NOT NULL,
        "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "story_id" text NOT NULL REFERENCES "stories"("id") ON DELETE CASCADE,
        "chapter_id" text REFERENCES "chapters"("id") ON DELETE CASCADE,
        "scene_id" text REFERENCES "scenes"("id") ON DELETE CASCADE,
        "parent_comment_id" text REFERENCES "comments"("id") ON DELETE CASCADE,
        "depth" integer DEFAULT 0 NOT NULL,
        "like_count" integer DEFAULT 0 NOT NULL,
        "reply_count" integer DEFAULT 0 NOT NULL,
        "is_edited" boolean DEFAULT false NOT NULL,
        "is_deleted" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log('✓ New comments table created');

    console.log('Creating indexes...');
    await client`CREATE INDEX "comments_story_id_idx" ON "comments"("story_id")`;
    await client`CREATE INDEX "comments_chapter_id_idx" ON "comments"("chapter_id")`;
    await client`CREATE INDEX "comments_scene_id_idx" ON "comments"("scene_id")`;
    await client`CREATE INDEX "comments_parent_comment_id_idx" ON "comments"("parent_comment_id")`;
    await client`CREATE INDEX "comments_user_id_idx" ON "comments"("user_id")`;
    await client`CREATE INDEX "comments_created_at_idx" ON "comments"("created_at")`;
    console.log('✓ All indexes created');

    console.log('\n✅ Comments table recreated successfully with correct schema!');
  } catch (error) {
    console.error('❌ Error recreating table:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

recreateCommentsTable();

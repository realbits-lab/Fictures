import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);

async function applyLikesTables() {
  try {
    console.log('Creating comment_likes table...');
    await client`
      CREATE TABLE IF NOT EXISTS "comment_likes" (
        "id" text PRIMARY KEY NOT NULL,
        "comment_id" text NOT NULL REFERENCES "comments"("id") ON DELETE CASCADE,
        "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "comment_likes_comment_id_user_id_unique" UNIQUE("comment_id", "user_id")
      )
    `;
    console.log('✓ comment_likes table created');

    console.log('Creating story_likes table...');
    await client`
      CREATE TABLE IF NOT EXISTS "story_likes" (
        "id" text PRIMARY KEY NOT NULL,
        "story_id" text NOT NULL REFERENCES "stories"("id") ON DELETE CASCADE,
        "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "story_likes_story_id_user_id_unique" UNIQUE("story_id", "user_id")
      )
    `;
    console.log('✓ story_likes table created');

    console.log('Creating chapter_likes table...');
    await client`
      CREATE TABLE IF NOT EXISTS "chapter_likes" (
        "id" text PRIMARY KEY NOT NULL,
        "chapter_id" text NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
        "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "chapter_likes_chapter_id_user_id_unique" UNIQUE("chapter_id", "user_id")
      )
    `;
    console.log('✓ chapter_likes table created');

    console.log('Creating scene_likes table...');
    await client`
      CREATE TABLE IF NOT EXISTS "scene_likes" (
        "id" text PRIMARY KEY NOT NULL,
        "scene_id" text NOT NULL REFERENCES "scenes"("id") ON DELETE CASCADE,
        "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "scene_likes_scene_id_user_id_unique" UNIQUE("scene_id", "user_id")
      )
    `;
    console.log('✓ scene_likes table created');

    console.log('\nCreating indexes...');

    await client`CREATE INDEX IF NOT EXISTS "comment_likes_comment_id_idx" ON "comment_likes"("comment_id")`;
    await client`CREATE INDEX IF NOT EXISTS "comment_likes_user_id_idx" ON "comment_likes"("user_id")`;
    console.log('✓ comment_likes indexes created');

    await client`CREATE INDEX IF NOT EXISTS "story_likes_story_id_idx" ON "story_likes"("story_id")`;
    await client`CREATE INDEX IF NOT EXISTS "story_likes_user_id_idx" ON "story_likes"("user_id")`;
    console.log('✓ story_likes indexes created');

    await client`CREATE INDEX IF NOT EXISTS "chapter_likes_chapter_id_idx" ON "chapter_likes"("chapter_id")`;
    await client`CREATE INDEX IF NOT EXISTS "chapter_likes_user_id_idx" ON "chapter_likes"("user_id")`;
    console.log('✓ chapter_likes indexes created');

    await client`CREATE INDEX IF NOT EXISTS "scene_likes_scene_id_idx" ON "scene_likes"("scene_id")`;
    await client`CREATE INDEX IF NOT EXISTS "scene_likes_user_id_idx" ON "scene_likes"("user_id")`;
    console.log('✓ scene_likes indexes created');

    console.log('\n✅ All like tables and indexes created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyLikesTables();

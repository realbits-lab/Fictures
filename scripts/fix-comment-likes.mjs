import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);

async function fixCommentLikes() {
  try {
    console.log('Recreating comment_likes table with correct foreign key...');

    await client`DROP TABLE IF EXISTS comment_likes CASCADE`;
    console.log('✓ Old comment_likes table dropped');

    await client`
      CREATE TABLE "comment_likes" (
        "id" text PRIMARY KEY NOT NULL,
        "comment_id" text NOT NULL REFERENCES "comments"("id") ON DELETE CASCADE,
        "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "comment_likes_comment_id_user_id_unique" UNIQUE("comment_id", "user_id")
      )
    `;
    console.log('✓ comment_likes table recreated');

    await client`CREATE INDEX "comment_likes_comment_id_idx" ON "comment_likes"("comment_id")`;
    await client`CREATE INDEX "comment_likes_user_id_idx" ON "comment_likes"("user_id")`;
    console.log('✓ Indexes created');

    console.log('\n✅ comment_likes table fixed!');
  } catch (error) {
    console.error('❌ Error fixing table:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixCommentLikes();

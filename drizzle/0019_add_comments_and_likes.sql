-- Add comments table for scene-level comments in reading page
CREATE TABLE IF NOT EXISTS "comments" (
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
);

-- Add comment_likes table
CREATE TABLE IF NOT EXISTS "comment_likes" (
  "id" text PRIMARY KEY NOT NULL,
  "comment_id" text NOT NULL REFERENCES "comments"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "comment_likes_comment_id_user_id_unique" UNIQUE("comment_id", "user_id")
);

-- Add story_likes table
CREATE TABLE IF NOT EXISTS "story_likes" (
  "id" text PRIMARY KEY NOT NULL,
  "story_id" text NOT NULL REFERENCES "stories"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "story_likes_story_id_user_id_unique" UNIQUE("story_id", "user_id")
);

-- Add chapter_likes table
CREATE TABLE IF NOT EXISTS "chapter_likes" (
  "id" text PRIMARY KEY NOT NULL,
  "chapter_id" text NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "chapter_likes_chapter_id_user_id_unique" UNIQUE("chapter_id", "user_id")
);

-- Add scene_likes table
CREATE TABLE IF NOT EXISTS "scene_likes" (
  "id" text PRIMARY KEY NOT NULL,
  "scene_id" text NOT NULL REFERENCES "scenes"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "scene_likes_scene_id_user_id_unique" UNIQUE("scene_id", "user_id")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "comments_story_id_idx" ON "comments"("story_id");
CREATE INDEX IF NOT EXISTS "comments_chapter_id_idx" ON "comments"("chapter_id");
CREATE INDEX IF NOT EXISTS "comments_scene_id_idx" ON "comments"("scene_id");
CREATE INDEX IF NOT EXISTS "comments_parent_comment_id_idx" ON "comments"("parent_comment_id");
CREATE INDEX IF NOT EXISTS "comments_user_id_idx" ON "comments"("user_id");
CREATE INDEX IF NOT EXISTS "comments_created_at_idx" ON "comments"("created_at");

CREATE INDEX IF NOT EXISTS "comment_likes_comment_id_idx" ON "comment_likes"("comment_id");
CREATE INDEX IF NOT EXISTS "comment_likes_user_id_idx" ON "comment_likes"("user_id");

CREATE INDEX IF NOT EXISTS "story_likes_story_id_idx" ON "story_likes"("story_id");
CREATE INDEX IF NOT EXISTS "story_likes_user_id_idx" ON "story_likes"("user_id");

CREATE INDEX IF NOT EXISTS "chapter_likes_chapter_id_idx" ON "chapter_likes"("chapter_id");
CREATE INDEX IF NOT EXISTS "chapter_likes_user_id_idx" ON "chapter_likes"("user_id");

CREATE INDEX IF NOT EXISTS "scene_likes_scene_id_idx" ON "scene_likes"("scene_id");
CREATE INDEX IF NOT EXISTS "scene_likes_user_id_idx" ON "scene_likes"("user_id");

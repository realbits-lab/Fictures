-- Create Fuma Comment tables for documentation pages

-- Fuma Comments table
CREATE TABLE IF NOT EXISTS "fuma_comments" (
  "id" text PRIMARY KEY NOT NULL,
  "page" text NOT NULL,
  "content" text NOT NULL,
  "author_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "parent_id" text,
  "depth" integer DEFAULT 0 NOT NULL,
  "is_edited" boolean DEFAULT false NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Fuma Rates table (for reactions/ratings on comments)
CREATE TABLE IF NOT EXISTS "fuma_rates" (
  "id" text PRIMARY KEY NOT NULL,
  "comment_id" text NOT NULL REFERENCES "fuma_comments"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "value" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("comment_id", "user_id")
);

-- Fuma Roles table (for user roles in commenting)
CREATE TABLE IF NOT EXISTS "fuma_roles" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE UNIQUE,
  "role" text DEFAULT 'user' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "fuma_comments_page_idx" ON "fuma_comments"("page");
CREATE INDEX IF NOT EXISTS "fuma_comments_author_id_idx" ON "fuma_comments"("author_id");
CREATE INDEX IF NOT EXISTS "fuma_comments_parent_id_idx" ON "fuma_comments"("parent_id");
CREATE INDEX IF NOT EXISTS "fuma_rates_comment_id_idx" ON "fuma_rates"("comment_id");
CREATE INDEX IF NOT EXISTS "fuma_rates_user_id_idx" ON "fuma_rates"("user_id");
CREATE INDEX IF NOT EXISTS "fuma_roles_user_id_idx" ON "fuma_roles"("user_id");

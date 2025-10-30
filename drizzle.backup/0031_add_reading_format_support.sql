-- Add reading_format enum type
DO $$ BEGIN
  CREATE TYPE "reading_format" AS ENUM('novel', 'comic');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add reading_format column with default 'novel' for existing rows
ALTER TABLE "reading_history" ADD COLUMN IF NOT EXISTS "reading_format" "reading_format" DEFAULT 'novel' NOT NULL;

-- Add format-specific progress tracking columns
ALTER TABLE "reading_history" ADD COLUMN IF NOT EXISTS "last_scene_id" text;
ALTER TABLE "reading_history" ADD COLUMN IF NOT EXISTS "last_panel_id" text;
ALTER TABLE "reading_history" ADD COLUMN IF NOT EXISTS "last_page_number" integer;

-- Drop old unique constraint
ALTER TABLE "reading_history" DROP CONSTRAINT IF EXISTS "user_story_unique";

-- Add new unique constraint including format
ALTER TABLE "reading_history" ADD CONSTRAINT "user_story_format_unique" UNIQUE("user_id", "story_id", "reading_format");

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "reading_history_user_format_idx" ON "reading_history"("user_id", "reading_format");
CREATE INDEX IF NOT EXISTS "reading_history_story_format_idx" ON "reading_history"("story_id", "reading_format");
CREATE INDEX IF NOT EXISTS "reading_history_format_last_read_idx" ON "reading_history"("reading_format", "last_read_at" DESC);

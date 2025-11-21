-- Migration: Unify status enum across stories, scenes (novel and comic)
-- Date: 2025-01-15
-- Description:
--   1. Update status enum values from "writing" | "published" to "draft" | "published"
--   2. Remove chapters.status field
--   3. Rename scenes.visibility to scenes.novel_status
--   4. Rename scenes.comic_status enum (already snake_case in DB)
--   5. Remove visibility and comic_status enum types
--   6. Use unified status enum for all publishing states

-- Step 1: Update stories.status from "writing" to "draft"
ALTER TABLE stories ALTER COLUMN status TYPE text;
UPDATE stories SET status = 'draft' WHERE status = 'writing';

-- Step 2: Remove chapters.status field
ALTER TABLE chapters DROP COLUMN IF EXISTS status;
ALTER TABLE chapters DROP COLUMN IF EXISTS published_at;
ALTER TABLE chapters DROP COLUMN IF EXISTS scheduled_for;

-- Step 3: Rename scenes.visibility to scenes.novel_status and update values
ALTER TABLE scenes RENAME COLUMN visibility TO novel_status;
ALTER TABLE scenes ALTER COLUMN novel_status TYPE text;
UPDATE scenes SET novel_status = 'draft' WHERE novel_status IN ('private', 'unlisted');
UPDATE scenes SET novel_status = 'published' WHERE novel_status = 'public';

-- Step 4: Update scenes.comic_status values (field already named comic_status)
ALTER TABLE scenes ALTER COLUMN comic_status TYPE text;
UPDATE scenes SET comic_status = 'draft' WHERE comic_status IN ('none', 'draft');
UPDATE scenes SET comic_status = 'published' WHERE comic_status = 'published';

-- Step 5: Drop old enum types
DROP TYPE IF EXISTS visibility CASCADE;
DROP TYPE IF EXISTS comic_status CASCADE;

-- Step 6: Recreate status enum with new values
DROP TYPE IF EXISTS status CASCADE;
CREATE TYPE status AS ENUM ('draft', 'published');

-- Step 7: Update column types to use new enum
ALTER TABLE stories ALTER COLUMN status TYPE status USING status::text::status;
ALTER TABLE stories ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE scenes ALTER COLUMN novel_status TYPE status USING novel_status::text::status;
ALTER TABLE scenes ALTER COLUMN novel_status SET DEFAULT 'draft';

ALTER TABLE scenes ALTER COLUMN comic_status TYPE status USING comic_status::text::status;
ALTER TABLE scenes ALTER COLUMN comic_status SET DEFAULT 'draft';

-- Step 8: Update index name for scenes visibility -> novel_status
DROP INDEX IF EXISTS idx_scenes_visibility;
CREATE INDEX idx_scenes_novel_status ON scenes USING btree (novel_status);

-- Step 9: Add comment to explain comic existence check
COMMENT ON COLUMN scenes.comic_panel_count IS 'Use comic_panel_count = 0 to check if comic exists (replaces old comic_status = "none")';

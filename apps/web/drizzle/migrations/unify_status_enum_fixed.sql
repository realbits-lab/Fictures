-- Migration: Unify status enum across stories, scenes (novel and comic)
-- Date: 2025-01-15
-- Description: Fixed version that properly handles enum type conversion

-- Step 1: Convert stories.status to text and update values
ALTER TABLE stories ALTER COLUMN status TYPE text;
UPDATE stories SET status = 'draft' WHERE status = 'writing';
UPDATE stories SET status = 'published' WHERE status = 'published';

-- Step 2: Remove chapters.status field
ALTER TABLE chapters DROP COLUMN IF EXISTS status;
ALTER TABLE chapters DROP COLUMN IF EXISTS published_at;
ALTER TABLE chapters DROP COLUMN IF EXISTS scheduled_for;

-- Step 3: Rename scenes.visibility to scenes.novel_status and convert to text
ALTER TABLE scenes RENAME COLUMN visibility TO novel_status;
ALTER TABLE scenes ALTER COLUMN novel_status TYPE text;
UPDATE scenes SET novel_status = 'draft' WHERE novel_status IN ('private', 'unlisted');
UPDATE scenes SET novel_status = 'published' WHERE novel_status = 'public';

-- Step 4: Convert scenes.comic_status to text and update values
ALTER TABLE scenes ALTER COLUMN comic_status TYPE text;
UPDATE scenes SET comic_status = 'draft' WHERE comic_status IN ('none', 'draft');
UPDATE scenes SET comic_status = 'published' WHERE comic_status = 'published';

-- Step 5: Drop old enum types
DROP TYPE IF EXISTS visibility CASCADE;
DROP TYPE IF EXISTS comic_status CASCADE;
DROP TYPE IF EXISTS status CASCADE;

-- Step 6: Create new status enum with final values
CREATE TYPE status AS ENUM ('draft', 'published');

-- Step 7: Convert all columns back to use the new enum
ALTER TABLE stories ALTER COLUMN status TYPE status USING status::status;
ALTER TABLE stories ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE stories ALTER COLUMN status SET NOT NULL;

ALTER TABLE scenes ALTER COLUMN novel_status TYPE status USING novel_status::status;
ALTER TABLE scenes ALTER COLUMN novel_status SET DEFAULT 'draft';
ALTER TABLE scenes ALTER COLUMN novel_status SET NOT NULL;

ALTER TABLE scenes ALTER COLUMN comic_status TYPE status USING comic_status::status;
ALTER TABLE scenes ALTER COLUMN comic_status SET DEFAULT 'draft';
ALTER TABLE scenes ALTER COLUMN comic_status SET NOT NULL;

-- Step 8: Update index name for scenes visibility -> novel_status
DROP INDEX IF EXISTS idx_scenes_visibility;
CREATE INDEX IF NOT EXISTS idx_scenes_novel_status ON scenes USING btree (novel_status);

-- Step 9: Add comment to explain comic existence check
COMMENT ON COLUMN scenes.comic_panel_count IS 'Use comic_panel_count = 0 to check if comic exists (replaces old comic_status = "none")';

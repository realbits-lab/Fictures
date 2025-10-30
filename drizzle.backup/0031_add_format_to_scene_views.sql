-- Add reading format support to scene view tracking
-- Allows separate tracking for novel (text) and comic (panel) viewing

-- Add reading_format column to scene_views
ALTER TABLE scene_views
ADD COLUMN IF NOT EXISTS reading_format reading_format DEFAULT 'novel' NOT NULL;

-- Drop old unique constraints (they don't include format)
DROP INDEX IF EXISTS idx_scene_views_unique_user;
DROP INDEX IF EXISTS idx_scene_views_unique_session;

-- Create new unique constraints that include format
-- This allows same user/session to view same scene in both novel and comic formats
CREATE UNIQUE INDEX IF NOT EXISTS idx_scene_views_unique_user_format
  ON scene_views(scene_id, user_id, reading_format)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_scene_views_unique_session_format
  ON scene_views(scene_id, session_id, reading_format)
  WHERE session_id IS NOT NULL AND user_id IS NULL;

-- Add format-specific view count columns to scenes table
ALTER TABLE scenes
ADD COLUMN IF NOT EXISTS novel_view_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS novel_unique_view_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS comic_view_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS comic_unique_view_count INTEGER NOT NULL DEFAULT 0;

-- Migrate existing view data to novel format (backward compatibility)
-- Existing views are assumed to be novel views
UPDATE scene_views SET reading_format = 'novel' WHERE reading_format IS NULL;

-- Migrate existing scene view counts to novel counts
UPDATE scenes
SET
  novel_view_count = view_count,
  novel_unique_view_count = unique_view_count
WHERE view_count > 0 OR unique_view_count > 0;

-- Keep old columns for total counts across both formats
-- They will be calculated as: novel_* + comic_*
-- Or we can just keep them and update them on each view

-- Add index for format-based queries
CREATE INDEX IF NOT EXISTS idx_scene_views_format ON scene_views(reading_format);

-- Comments
COMMENT ON COLUMN scene_views.reading_format IS 'Format in which scene was viewed: novel (text) or comic (panels)';
COMMENT ON COLUMN scenes.novel_view_count IS 'Total views in novel (text) format';
COMMENT ON COLUMN scenes.novel_unique_view_count IS 'Unique viewers in novel format';
COMMENT ON COLUMN scenes.comic_view_count IS 'Total views in comic (panel) format';
COMMENT ON COLUMN scenes.comic_unique_view_count IS 'Unique viewers in comic format';

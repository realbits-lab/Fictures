-- Migration: Add comic status fields to scenes table
-- Date: 2025-10-26
-- Description: Enable independent publishing workflow for comic panels

-- Create comic_status enum
DO $$ BEGIN
  CREATE TYPE comic_status AS ENUM ('none', 'draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add comic status and metadata columns to scenes table
ALTER TABLE scenes
ADD COLUMN IF NOT EXISTS comic_status comic_status NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS comic_published_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS comic_published_by TEXT REFERENCES users(id),
ADD COLUMN IF NOT EXISTS comic_unpublished_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS comic_unpublished_by TEXT REFERENCES users(id),
ADD COLUMN IF NOT EXISTS comic_generated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS comic_panel_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comic_version INTEGER DEFAULT 1;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scenes_comic_status ON scenes(comic_status);
CREATE INDEX IF NOT EXISTS idx_scenes_comic_published_at ON scenes(comic_published_at);

-- Backfill: Set comic_status to 'published' for scenes that already have comic panels
UPDATE scenes
SET
  comic_status = 'published',
  comic_panel_count = (
    SELECT COUNT(*) FROM comic_panels
    WHERE comic_panels.scene_id = scenes.id
  ),
  comic_published_at = COALESCE(
    (SELECT MIN(created_at) FROM comic_panels WHERE comic_panels.scene_id = scenes.id),
    scenes.created_at
  )
WHERE id IN (
  SELECT DISTINCT scene_id FROM comic_panels
);

-- Comment the columns for documentation
COMMENT ON COLUMN scenes.comic_status IS 'Status of comic panels: none (no panels), draft (panels exist but unpublished), published (panels visible)';
COMMENT ON COLUMN scenes.comic_published_at IS 'When comic panels were published';
COMMENT ON COLUMN scenes.comic_published_by IS 'User who published the comic panels';
COMMENT ON COLUMN scenes.comic_unpublished_at IS 'When comic panels were unpublished';
COMMENT ON COLUMN scenes.comic_unpublished_by IS 'User who unpublished the comic panels';
COMMENT ON COLUMN scenes.comic_generated_at IS 'When comic panels were generated';
COMMENT ON COLUMN scenes.comic_panel_count IS 'Number of comic panels for this scene';
COMMENT ON COLUMN scenes.comic_version IS 'Version number for comic panels (for regeneration tracking)';

-- Add optimized indexes for comic queries
-- Migration: add_comic_indexes
-- Date: 2025-10-26

-- Composite index for published comics queries
-- Optimizes: WHERE visibility = 'public' AND comic_status = 'published' ORDER BY order_index
CREATE INDEX IF NOT EXISTS idx_scenes_comic_published_lookup
  ON scenes(visibility, comic_status, order_index)
  WHERE visibility = 'public' AND comic_status = 'published';

-- Composite index for chapter-specific comic queries
-- Optimizes: WHERE chapter_id = ? AND visibility = 'public' AND comic_status = 'published' ORDER BY order_index
CREATE INDEX IF NOT EXISTS idx_scenes_chapter_comic_published
  ON scenes(chapter_id, visibility, comic_status, order_index)
  WHERE visibility = 'public' AND comic_status = 'published';

-- Index for comic panels by scene (for loading panels for a scene)
-- Optimizes: WHERE scene_id = ? ORDER BY panel_number
CREATE INDEX IF NOT EXISTS idx_comic_panels_scene_id
  ON comic_panels(scene_id, panel_number);

-- Index for comic panels by panel number (for sequential loading)
CREATE INDEX IF NOT EXISTS idx_comic_panels_panel_number
  ON comic_panels(panel_number);

-- Partial index for scenes with comic panels (excludes scenes without comics)
-- Optimizes: WHERE comic_status != 'none' AND comic_panel_count > 0
CREATE INDEX IF NOT EXISTS idx_scenes_has_comics
  ON scenes(id, comic_status, comic_panel_count)
  WHERE comic_status != 'none' AND comic_panel_count > 0;

-- Index for comic view tracking queries
-- Optimizes: ORDER BY comic_view_count DESC for top comics
CREATE INDEX IF NOT EXISTS idx_scenes_comic_popularity
  ON scenes(comic_unique_view_count DESC, comic_view_count DESC)
  WHERE comic_status = 'published';

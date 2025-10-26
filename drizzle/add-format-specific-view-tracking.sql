-- Add format-specific view tracking columns to scenes table
ALTER TABLE scenes 
  ADD COLUMN IF NOT EXISTS novel_view_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS novel_unique_view_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS comic_view_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS comic_unique_view_count INTEGER DEFAULT 0 NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scenes_novel_view_count ON scenes(novel_view_count DESC);
CREATE INDEX IF NOT EXISTS idx_scenes_comic_view_count ON scenes(comic_view_count DESC);

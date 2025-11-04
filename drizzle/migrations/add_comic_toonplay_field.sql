-- Migration: Add comic_toonplay field to scenes table
-- Description: Stores the generated toonplay specification (panel breakdown with dialogue, SFX, shot types)
-- Date: 2025-11-03

-- Add comic_toonplay column to scenes table
ALTER TABLE scenes
ADD COLUMN comic_toonplay JSONB;

-- Add comment for documentation
COMMENT ON COLUMN scenes.comic_toonplay IS 'Generated toonplay specification for comic panels - includes panel breakdown with dialogue, SFX, shot types, and visual descriptions';

-- Create GIN index for faster JSONB queries (optional, but useful for future queries)
CREATE INDEX idx_scenes_comic_toonplay ON scenes USING GIN (comic_toonplay);

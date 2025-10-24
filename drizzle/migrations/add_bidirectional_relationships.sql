-- Migration: Add bi-directional relationships
-- This migration adds JSON array fields to store child IDs for direct lookup

-- Add bi-directional fields to stories table
ALTER TABLE stories ADD COLUMN part_ids JSONB DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE stories ADD COLUMN chapter_ids JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Add bi-directional fields to parts table
ALTER TABLE parts ADD COLUMN chapter_ids JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Add bi-directional fields to chapters table
ALTER TABLE chapters ADD COLUMN scene_ids JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Create GIN indexes for efficient array queries
CREATE INDEX idx_stories_part_ids ON stories USING GIN (part_ids);
CREATE INDEX idx_stories_chapter_ids ON stories USING GIN (chapter_ids);
CREATE INDEX idx_parts_chapter_ids ON parts USING GIN (chapter_ids);
CREATE INDEX idx_chapters_scene_ids ON chapters USING GIN (scene_ids);

-- Populate bi-directional relationships from existing foreign key relationships
-- Update stories with their part IDs
UPDATE stories 
SET part_ids = (
  SELECT COALESCE(jsonb_agg(p.id), '[]'::jsonb)
  FROM parts p 
  WHERE p.story_id = stories.id
);

-- Update stories with their chapter IDs (both part-based and standalone)
UPDATE stories 
SET chapter_ids = (
  SELECT COALESCE(jsonb_agg(c.id ORDER BY c.order_index), '[]'::jsonb)
  FROM chapters c 
  WHERE c.story_id = stories.id
);

-- Update parts with their chapter IDs
UPDATE parts 
SET chapter_ids = (
  SELECT COALESCE(jsonb_agg(c.id ORDER BY c.order_index), '[]'::jsonb)
  FROM chapters c 
  WHERE c.part_id = parts.id
);

-- Update chapters with their scene IDs
UPDATE chapters 
SET scene_ids = (
  SELECT COALESCE(jsonb_agg(s.id ORDER BY s.order_index), '[]'::jsonb)
  FROM scenes s 
  WHERE s.chapter_id = chapters.id
);

-- Add constraints to ensure data integrity
ALTER TABLE stories ADD CONSTRAINT check_part_ids_is_array CHECK (jsonb_typeof(part_ids) = 'array');
ALTER TABLE stories ADD CONSTRAINT check_chapter_ids_is_array CHECK (jsonb_typeof(chapter_ids) = 'array');
ALTER TABLE parts ADD CONSTRAINT check_chapter_ids_is_array CHECK (jsonb_typeof(chapter_ids) = 'array');
ALTER TABLE chapters ADD CONSTRAINT check_scene_ids_is_array CHECK (jsonb_typeof(scene_ids) = 'array');
-- Migration: Remove redundant ID arrays from stories, parts, and chapters tables
-- These arrays are redundant with the foreign key relationships already in place
-- We use orderIndex column for ordering instead

-- Remove part_ids from stories table
ALTER TABLE "stories" DROP COLUMN IF EXISTS "part_ids";

-- Remove chapter_ids from stories table
ALTER TABLE "stories" DROP COLUMN IF EXISTS "chapter_ids";

-- Remove chapter_ids from parts table
ALTER TABLE "parts" DROP COLUMN IF EXISTS "chapter_ids";

-- Remove scene_ids from chapters table
ALTER TABLE "chapters" DROP COLUMN IF EXISTS "scene_ids";

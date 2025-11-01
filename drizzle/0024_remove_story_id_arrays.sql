-- Migration: Remove redundant JSON array columns from stories table
-- These columns were populated during generation but never used for queries
-- All queries use foreign key relationships instead (parts.storyId, chapters.storyId, scenes.chapterId)
-- Removing these eliminates data redundancy and desync risks

-- Drop unused JSON array columns
ALTER TABLE "stories" DROP COLUMN IF EXISTS "part_ids";
ALTER TABLE "stories" DROP COLUMN IF EXISTS "chapter_ids";
ALTER TABLE "stories" DROP COLUMN IF EXISTS "scene_ids";

-- Migration: Change JSON columns to TEXT content columns
-- Date: 2025-01-16
-- Description: Convert storyData and partData from JSON to TEXT as content field to better handle YAML data

-- First, add the new content columns
ALTER TABLE "stories" ADD COLUMN "content" text DEFAULT '';
ALTER TABLE "parts" ADD COLUMN "content" text DEFAULT '';

-- Copy existing JSON data to text format (if any exists)
-- Note: This handles the case where JSON data exists and converts it to a string representation
UPDATE "stories" SET "content" = COALESCE("story_data"::text, '') WHERE "story_data" IS NOT NULL;
UPDATE "parts" SET "content" = COALESCE("part_data"::text, '') WHERE "part_data" IS NOT NULL;

-- Drop the old JSON columns
ALTER TABLE "stories" DROP COLUMN IF EXISTS "story_data";
ALTER TABLE "parts" DROP COLUMN IF EXISTS "part_data";
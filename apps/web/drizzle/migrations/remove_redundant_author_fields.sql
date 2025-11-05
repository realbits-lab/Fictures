-- Remove redundant author_id fields from chapters and parts tables
-- Author information can be obtained through story_id join with stories table
-- This improves data normalization and eliminates potential inconsistencies

-- Remove author_id from chapters table
ALTER TABLE "chapters" DROP COLUMN IF EXISTS "author_id";

-- Remove author_id from parts table
ALTER TABLE "parts" DROP COLUMN IF EXISTS "author_id";

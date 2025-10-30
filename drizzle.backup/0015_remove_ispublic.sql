-- Remove isPublic column from stories table
ALTER TABLE stories DROP COLUMN IF EXISTS is_public;
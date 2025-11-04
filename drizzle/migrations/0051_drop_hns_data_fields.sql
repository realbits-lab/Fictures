-- Remove legacy hns_data fields from database
-- This migration removes deprecated hns_data JSONB columns that were part of the old legacy system
-- The platform uses the Adversity-Triumph Engine methodology

-- Drop indexes first
DROP INDEX IF EXISTS idx_stories_hns_data;
DROP INDEX IF EXISTS idx_parts_hns_data;
DROP INDEX IF EXISTS idx_chapters_hns_data;
DROP INDEX IF EXISTS idx_scenes_hns_data;
DROP INDEX IF EXISTS idx_characters_hns_data;

-- Drop hns_data columns from all tables
ALTER TABLE stories DROP COLUMN IF EXISTS hns_data;
ALTER TABLE parts DROP COLUMN IF EXISTS hns_data;
ALTER TABLE chapters DROP COLUMN IF EXISTS hns_data;
ALTER TABLE scenes DROP COLUMN IF EXISTS hns_data;
ALTER TABLE characters DROP COLUMN IF EXISTS hns_data;

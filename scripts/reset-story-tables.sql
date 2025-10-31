-- Reset stories, parts, chapters, scenes tables
-- This script truncates all story-related tables in the correct order to handle foreign key constraints
-- WARNING: This will delete ALL data from these tables and related entities

-- Use CASCADE to automatically handle dependent tables
-- This is a single operation that handles all foreign key relationships

TRUNCATE TABLE stories CASCADE;

-- Verify tables are empty
SELECT
  'stories' as table_name, COUNT(*) as row_count FROM stories
UNION ALL
SELECT 'parts', COUNT(*) FROM parts
UNION ALL
SELECT 'chapters', COUNT(*) FROM chapters
UNION ALL
SELECT 'scenes', COUNT(*) FROM scenes
UNION ALL
SELECT 'comic_panels', COUNT(*) FROM comic_panels
UNION ALL
SELECT 'characters', COUNT(*) FROM characters
UNION ALL
SELECT 'places', COUNT(*) FROM places
UNION ALL
SELECT 'settings', COUNT(*) FROM settings;

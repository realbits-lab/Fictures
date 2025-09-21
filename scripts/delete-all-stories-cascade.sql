-- Delete all stories and related data in the correct order
-- Start from the most dependent tables and work our way up

-- First, show what we're about to delete
SELECT 'Current data:' as status;
SELECT 'Stories:', COUNT(*) FROM stories;
SELECT 'Parts:', COUNT(*) FROM parts;
SELECT 'Chapters:', COUNT(*) FROM chapters;
SELECT 'Scenes:', COUNT(*) FROM scenes;
SELECT 'Characters:', COUNT(*) FROM characters;

-- Delete in the correct order (most dependent first)
DELETE FROM scenes;
DELETE FROM characters;
DELETE FROM chapters;
DELETE FROM parts;
DELETE FROM stories;

-- Verify deletion
SELECT 'After deletion:' as status;
SELECT 'Stories remaining:', COUNT(*) FROM stories;
SELECT 'Parts remaining:', COUNT(*) FROM parts;
SELECT 'Chapters remaining:', COUNT(*) FROM chapters;
SELECT 'Scenes remaining:', COUNT(*) FROM scenes;
SELECT 'Characters remaining:', COUNT(*) FROM characters;
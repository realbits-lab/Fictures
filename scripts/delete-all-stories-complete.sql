-- Delete all stories and ALL related data
-- Start from the most dependent tables

-- First, show what we're about to delete
SELECT 'Current data:' as status;
SELECT 'Stories:', COUNT(*) FROM stories;

-- Delete all related data first
DELETE FROM scenes WHERE "chapterId" IN (SELECT id FROM chapters);
DELETE FROM characters WHERE "storyId" IN (SELECT id FROM stories);
DELETE FROM settings WHERE story_id IN (SELECT id FROM stories);
DELETE FROM chapters WHERE "storyId" IN (SELECT id FROM stories);
DELETE FROM parts WHERE "storyId" IN (SELECT id FROM stories);

-- Now delete the stories
DELETE FROM stories;

-- Verify deletion
SELECT 'After deletion:' as status;
SELECT 'Stories remaining:', COUNT(*) FROM stories;
SELECT 'Parts remaining:', COUNT(*) FROM parts;
SELECT 'Chapters remaining:', COUNT(*) FROM chapters;
SELECT 'Scenes remaining:', COUNT(*) FROM scenes;
SELECT 'Characters remaining:', COUNT(*) FROM characters;
SELECT 'Settings remaining:', COUNT(*) FROM settings;
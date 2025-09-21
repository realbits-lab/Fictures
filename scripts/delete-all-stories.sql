-- Delete all stories and related data
-- This will cascade delete all related records due to foreign key constraints

-- First, let's check what we're about to delete
SELECT COUNT(*) as story_count FROM stories;
SELECT COUNT(*) as part_count FROM parts;
SELECT COUNT(*) as chapter_count FROM chapters;
SELECT COUNT(*) as scene_count FROM scenes;
SELECT COUNT(*) as character_count FROM characters;
SELECT COUNT(*) as ai_interaction_count FROM "aiInteractions";
SELECT COUNT(*) as community_post_count FROM "communityPosts";

-- Delete all stories (this will cascade to all related tables)
DELETE FROM stories;

-- Verify deletion
SELECT 'Stories deleted:', COUNT(*) as remaining_count FROM stories
UNION ALL
SELECT 'Parts deleted:', COUNT(*) FROM parts
UNION ALL
SELECT 'Chapters deleted:', COUNT(*) FROM chapters
UNION ALL
SELECT 'Scenes deleted:', COUNT(*) FROM scenes
UNION ALL
SELECT 'Characters deleted:', COUNT(*) FROM characters
UNION ALL
SELECT 'AI Interactions deleted:', COUNT(*) FROM "aiInteractions"
UNION ALL
SELECT 'Community Posts deleted:', COUNT(*) FROM "communityPosts";
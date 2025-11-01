-- Truncate all story-related tables
-- This script resets all story data while preserving users and system tables
-- Run with: psql $POSTGRES_URL -f scripts/truncate-story-tables.sql

BEGIN;

-- Disable triggers temporarily for faster truncation
SET session_replication_role = replica;

-- Truncate tables in order (children first to avoid FK constraint issues)

-- 1. Analytics and tracking (dependent on stories, chapters, scenes)
TRUNCATE TABLE analytics_events CASCADE;
TRUNCATE TABLE reading_sessions CASCADE;
TRUNCATE TABLE reading_history CASCADE;
TRUNCATE TABLE story_insights CASCADE;

-- 2. Community features (dependent on stories, chapters, scenes)
TRUNCATE TABLE community_posts CASCADE;
TRUNCATE TABLE post_likes CASCADE;
TRUNCATE TABLE post_views CASCADE;
TRUNCATE TABLE comment_likes CASCADE;
TRUNCATE TABLE comment_dislikes CASCADE;

-- 3. Likes and interactions (dependent on stories, chapters, scenes)
TRUNCATE TABLE story_likes CASCADE;
TRUNCATE TABLE chapter_likes CASCADE;
TRUNCATE TABLE scene_likes CASCADE;
TRUNCATE TABLE scene_dislikes CASCADE;
TRUNCATE TABLE scene_views CASCADE;

-- 4. Publishing and scheduling (dependent on chapters)
TRUNCATE TABLE publishing_schedules CASCADE;
TRUNCATE TABLE scheduled_publications CASCADE;

-- 5. Comic panels (dependent on scenes)
TRUNCATE TABLE comic_panels CASCADE;

-- 6. Scene evaluations (dependent on scenes)
TRUNCATE TABLE scene_evaluations CASCADE;

-- 7. Scenes (dependent on chapters)
TRUNCATE TABLE scenes CASCADE;

-- 8. Chapters (dependent on parts and stories)
TRUNCATE TABLE chapters CASCADE;

-- 9. Parts (dependent on stories)
TRUNCATE TABLE parts CASCADE;

-- 10. Characters and settings (dependent on stories)
TRUNCATE TABLE characters CASCADE;
TRUNCATE TABLE settings CASCADE;

-- 11. AI interactions and research (dependent on stories)
TRUNCATE TABLE ai_interactions CASCADE;
TRUNCATE TABLE research CASCADE;

-- 12. Stories (root table)
TRUNCATE TABLE stories CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;

-- Verify truncation
SELECT
  'stories' as table_name, COUNT(*) as row_count FROM stories
UNION ALL SELECT 'parts', COUNT(*) FROM parts
UNION ALL SELECT 'chapters', COUNT(*) FROM chapters
UNION ALL SELECT 'scenes', COUNT(*) FROM scenes
UNION ALL SELECT 'characters', COUNT(*) FROM characters
UNION ALL SELECT 'settings', COUNT(*) FROM settings
UNION ALL SELECT 'comic_panels', COUNT(*) FROM comic_panels
UNION ALL SELECT 'scene_evaluations', COUNT(*) FROM scene_evaluations
UNION ALL SELECT 'community_posts', COUNT(*) FROM community_posts
UNION ALL SELECT 'reading_history', COUNT(*) FROM reading_history
ORDER BY table_name;

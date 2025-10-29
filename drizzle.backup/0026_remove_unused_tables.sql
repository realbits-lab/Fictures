-- Remove unused database tables
-- These tables were defined in schema but never used in the codebase

-- Drop post_images table (unused - images stored directly in content_images JSON field)
DROP TABLE IF EXISTS "post_images" CASCADE;

-- Drop recommendation_feedback table (unused - no feedback collection implemented)
DROP TABLE IF EXISTS "recommendation_feedback" CASCADE;

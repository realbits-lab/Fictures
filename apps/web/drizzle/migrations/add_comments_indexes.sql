-- Migration: Add indexes for comments table optimization
-- Created: 2025-11-02
-- Purpose: Optimize comment queries for /novels/[id] page (reduce query time to <50ms)
-- Priority: Critical foreign key indexes + ordering index

-- Foreign key indexes (CRITICAL)
CREATE INDEX IF NOT EXISTS idx_comments_story_id ON comments(story_id);
CREATE INDEX IF NOT EXISTS idx_comments_chapter_id ON comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_comments_scene_id ON comments(scene_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);

-- Ordering index (for ORDER BY created_at queries)
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Composite indexes for common query patterns
-- Pattern 1: Get all comments for a story ordered by creation time
CREATE INDEX IF NOT EXISTS idx_comments_story_created ON comments(story_id, created_at);

-- Pattern 2: Get all comments for a chapter ordered by creation time
CREATE INDEX IF NOT EXISTS idx_comments_chapter_created ON comments(chapter_id, created_at);

-- Pattern 3: Get all comments for a scene ordered by creation time
CREATE INDEX IF NOT EXISTS idx_comments_scene_created ON comments(scene_id, created_at);

-- Pattern 4: Get user's comments ordered by creation time
CREATE INDEX IF NOT EXISTS idx_comments_user_created ON comments(user_id, created_at);

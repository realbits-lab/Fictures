-- Add indexes for featured story query optimization
-- These indexes will significantly speed up the query for finding the best story

-- Index for filtering published stories
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);

-- Composite index for sorting by rating, views, and word count
CREATE INDEX IF NOT EXISTS idx_stories_sorting ON stories(rating DESC NULLS LAST, view_count DESC NULLS LAST, current_word_count DESC NULLS LAST) WHERE status = 'published';

-- Index for chapter lookup by story and status
CREATE INDEX IF NOT EXISTS idx_chapters_story_status ON chapters(story_id, status);

-- Index for user lookup (author join)
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

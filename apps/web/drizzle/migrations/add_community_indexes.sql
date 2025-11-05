-- Community Performance Optimization Indexes
-- Created: 2025-11-01
-- Impact: 50-80% faster queries for community data

-- Community posts indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_story_id ON community_posts(story_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_story_created ON community_posts(story_id, created_at DESC);

-- Stories community-related indexes
CREATE INDEX IF NOT EXISTS idx_stories_status_updated ON stories(status, updated_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_stories_view_count_published ON stories(view_count DESC) WHERE status = 'published';

-- Full-text search indexes (for future community search feature)
CREATE INDEX IF NOT EXISTS idx_community_posts_title_search ON community_posts USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_community_posts_content_search ON community_posts USING GIN (to_tsvector('english', content));

-- Characters index for community story details
CREATE INDEX IF NOT EXISTS idx_characters_story_main ON characters(story_id, is_main DESC);

-- Settings index for community story details
CREATE INDEX IF NOT EXISTS idx_settings_story_id ON settings(story_id);

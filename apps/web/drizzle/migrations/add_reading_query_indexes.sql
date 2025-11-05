-- Migration: Add indexes for reading query optimization
-- Created: 2025-11-01
-- Purpose: Optimize database queries for reading mode (reduce 600-900ms queries to <50ms)

-- Parts table indexes
CREATE INDEX IF NOT EXISTS idx_parts_story_id ON parts(story_id);
CREATE INDEX IF NOT EXISTS idx_parts_order_index ON parts(order_index);

-- Chapters table indexes
CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id);
CREATE INDEX IF NOT EXISTS idx_chapters_part_id ON chapters(part_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order_index ON chapters(order_index);
CREATE INDEX IF NOT EXISTS idx_chapters_status ON chapters(status);

-- Scenes table indexes
CREATE INDEX IF NOT EXISTS idx_scenes_chapter_id ON scenes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_scenes_order_index ON scenes(order_index);
CREATE INDEX IF NOT EXISTS idx_scenes_visibility ON scenes(visibility);

-- Stories table indexes
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);

-- Characters table indexes (for future character queries)
CREATE INDEX IF NOT EXISTS idx_characters_story_id ON characters(story_id);

-- Settings table indexes (for future settings queries)
CREATE INDEX IF NOT EXISTS idx_settings_story_id ON settings(story_id);

-- Community tables indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_story_id ON community_posts(story_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_fuma_comments_page ON fuma_comments(page);
CREATE INDEX IF NOT EXISTS idx_fuma_comments_story_id ON fuma_comments(story_id);

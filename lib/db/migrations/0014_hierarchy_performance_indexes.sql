-- Migration: Add performance indexes for hierarchy navigation
-- This migration adds critical indexes to optimize hierarchy queries

-- Foreign key indexes for efficient joins
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_book_id ON stories(book_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_story_id ON parts(story_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapters_part_id ON chapters(part_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenes_chapter_id ON scenes(chapter_id);

-- Composite indexes for order-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_book_order ON stories(book_id, order_in_book);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_story_order ON parts(story_id, order_in_story);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapters_part_order ON chapters(part_id, order_in_part);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenes_chapter_order ON scenes(chapter_id, order_in_chapter);

-- Status-based filtering indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapters_status ON chapters(status) WHERE status IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_status ON books(status) WHERE status IS NOT NULL;

-- Word count aggregation indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_word_count ON books(word_count) WHERE word_count IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_word_count ON stories(word_count) WHERE word_count IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_word_count ON parts(word_count) WHERE word_count IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapters_word_count ON chapters(word_count) WHERE word_count IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenes_word_count ON scenes(word_count) WHERE word_count IS NOT NULL;

-- User-based filtering indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_user_id ON books(user_id);

-- Multi-column indexes for complex hierarchy queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hierarchy_full_path ON chapters(
  part_id, 
  order_in_part, 
  status, 
  word_count
) WHERE status IS NOT NULL;

-- Partial indexes for published content
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_published_books ON books(created_at, user_id) WHERE status = 'published';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_published_chapters ON chapters(part_id, order_in_part) WHERE status = 'published';

-- Search and filtering indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_title_search ON books USING gin(to_tsvector('english', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_genre ON books(genre) WHERE genre IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_language ON books(language) WHERE language IS NOT NULL;

-- Timestamp indexes for recent content queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_created_at ON books(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapters_updated_at ON chapters(updated_at DESC) WHERE updated_at IS NOT NULL;

-- Covering indexes for common queries (PostgreSQL partial covering indexes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapters_with_metadata ON chapters(
  part_id, 
  order_in_part
) INCLUDE (id, title, word_count, status, created_at) WHERE status IS NOT NULL;

-- Unique constraint indexes (if not already present)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_unique_book_order ON stories(book_id, order_in_book);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_unique_story_order ON parts(story_id, order_in_story);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_chapters_unique_part_order ON chapters(part_id, order_in_part);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_scenes_unique_chapter_order ON scenes(chapter_id, order_in_chapter);

-- Additional indexes for AI context and search features
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapters_content_search ON chapters USING gin(to_tsvector('english', content)) WHERE content IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenes_content_search ON scenes USING gin(to_tsvector('english', content)) WHERE content IS NOT NULL;

-- Performance monitoring view
CREATE OR REPLACE VIEW hierarchy_performance_stats AS
SELECT 
  'books' as table_name,
  COUNT(*) as total_records,
  AVG(word_count) as avg_word_count,
  MAX(word_count) as max_word_count
FROM books
WHERE word_count IS NOT NULL
UNION ALL
SELECT 
  'stories' as table_name,
  COUNT(*) as total_records,
  AVG(word_count) as avg_word_count,
  MAX(word_count) as max_word_count
FROM stories
WHERE word_count IS NOT NULL
UNION ALL
SELECT 
  'parts' as table_name,
  COUNT(*) as total_records,
  AVG(word_count) as avg_word_count,
  MAX(word_count) as max_word_count
FROM parts
WHERE word_count IS NOT NULL
UNION ALL
SELECT 
  'chapters' as table_name,
  COUNT(*) as total_records,
  AVG(word_count) as avg_word_count,
  MAX(word_count) as max_word_count
FROM chapters
WHERE word_count IS NOT NULL
UNION ALL
SELECT 
  'scenes' as table_name,
  COUNT(*) as total_records,
  AVG(word_count) as avg_word_count,
  MAX(word_count) as max_word_count
FROM scenes
WHERE word_count IS NOT NULL;

-- Index usage monitoring function
CREATE OR REPLACE FUNCTION analyze_hierarchy_query_performance()
RETURNS TABLE(
  table_name text,
  index_name text,
  index_size text,
  index_usage text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    indexname as index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE 
      WHEN idx_tup_read = 0 THEN 'UNUSED'
      WHEN idx_tup_read < 1000 THEN 'LOW'
      WHEN idx_tup_read < 10000 THEN 'MEDIUM'
      ELSE 'HIGH'
    END as index_usage
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('books', 'stories', 'parts', 'chapters', 'scenes')
  ORDER BY idx_tup_read DESC;
END;
$$ LANGUAGE plpgsql;
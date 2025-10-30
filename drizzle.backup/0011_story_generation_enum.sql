-- Create enum type for story generation status
CREATE TYPE story_generation_status AS ENUM (
  'draft',
  'phase1_complete',
  'phase2_complete',
  'phase3_complete',
  'phase4_complete',
  'generating',
  'completed',
  'failed',
  'active',
  'hiatus',
  'archived'
);

-- Drop existing status column and recreate with enum type
ALTER TABLE stories
  DROP COLUMN IF EXISTS status;

ALTER TABLE stories
  ADD COLUMN status story_generation_status DEFAULT 'draft' NOT NULL;

-- Create community_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS community_posts (
  id TEXT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  story_id TEXT REFERENCES stories(id),
  author_id TEXT REFERENCES users(id) NOT NULL,
  type VARCHAR(50) DEFAULT 'discussion',
  tags JSON DEFAULT '[]'::json,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create community_replies table if it doesn't exist
CREATE TABLE IF NOT EXISTS community_replies (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  post_id TEXT REFERENCES community_posts(id) NOT NULL,
  author_id TEXT REFERENCES users(id) NOT NULL,
  parent_reply_id TEXT,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Update existing stories to appropriate status based on their content
UPDATE stories
SET status = CASE
  WHEN status = 'draft' THEN 'draft'::story_generation_status
  WHEN status = 'active' THEN 'active'::story_generation_status
  WHEN status = 'completed' THEN 'completed'::story_generation_status
  WHEN status = 'hiatus' THEN 'hiatus'::story_generation_status
  ELSE 'draft'::story_generation_status
END
WHERE status IS NOT NULL;
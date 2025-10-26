-- Add scene view tracking
-- Tracks both logged-in users (user_id) and anonymous users (session_id)

-- Create scene_views table to track individual views
CREATE TABLE IF NOT EXISTS scene_views (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT scene_views_user_or_session CHECK (
    (user_id IS NOT NULL) OR (session_id IS NOT NULL)
  )
);

-- Add view count columns to scenes table
ALTER TABLE scenes
ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_view_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scene_views_scene_id ON scene_views(scene_id);
CREATE INDEX IF NOT EXISTS idx_scene_views_user_id ON scene_views(user_id);
CREATE INDEX IF NOT EXISTS idx_scene_views_session_id ON scene_views(session_id);
CREATE INDEX IF NOT EXISTS idx_scene_views_viewed_at ON scene_views(viewed_at DESC);

-- Composite index for checking unique views
CREATE UNIQUE INDEX IF NOT EXISTS idx_scene_views_unique_user ON scene_views(scene_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_scene_views_unique_session ON scene_views(scene_id, session_id) WHERE session_id IS NOT NULL AND user_id IS NULL;

-- Comment on table
COMMENT ON TABLE scene_views IS 'Tracks scene views for both logged-in users and anonymous sessions';
COMMENT ON COLUMN scene_views.session_id IS 'Anonymous session ID for non-logged-in users (stored in cookie)';
COMMENT ON COLUMN scenes.view_count IS 'Total number of views (can include repeat views)';
COMMENT ON COLUMN scenes.unique_view_count IS 'Number of unique viewers (distinct users/sessions)';

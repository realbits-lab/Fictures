-- Add view tracking columns to scenes table
-- Migration: add_scene_view_tracking
-- Date: 2025-10-26

-- Add general view tracking fields
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS unique_view_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP;

-- Add format-specific view tracking fields
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS novel_view_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS novel_unique_view_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS comic_view_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS comic_unique_view_count INTEGER DEFAULT 0 NOT NULL;

-- Create scene_views table for tracking individual view events
CREATE TABLE IF NOT EXISTS scene_views (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  reading_format TEXT NOT NULL DEFAULT 'novel' CHECK (reading_format IN ('novel', 'comic')),
  ip_address TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scene_views_scene_id ON scene_views(scene_id);
CREATE INDEX IF NOT EXISTS idx_scene_views_user_id ON scene_views(user_id);
CREATE INDEX IF NOT EXISTS idx_scene_views_session_id ON scene_views(session_id);
CREATE INDEX IF NOT EXISTS idx_scene_views_reading_format ON scene_views(reading_format);
CREATE INDEX IF NOT EXISTS idx_scene_views_viewed_at ON scene_views(viewed_at);

-- Create composite index for checking existing views
CREATE INDEX IF NOT EXISTS idx_scene_views_lookup ON scene_views(scene_id, reading_format, user_id, session_id);

-- Add view tracking columns to scenes table
ALTER TABLE scenes 
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS unique_view_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_scenes_last_viewed_at ON scenes(last_viewed_at);
CREATE INDEX IF NOT EXISTS idx_scenes_view_count ON scenes(view_count DESC);

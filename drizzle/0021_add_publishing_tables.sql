-- Create visibility enum
CREATE TYPE visibility AS ENUM ('private', 'unlisted', 'public');

-- Create schedule type enum
CREATE TYPE schedule_type AS ENUM ('daily', 'weekly', 'custom', 'one-time');

-- Create publication status enum
CREATE TYPE publication_status AS ENUM ('pending', 'published', 'failed', 'cancelled');

-- Add publishing fields to scenes table
ALTER TABLE scenes
ADD COLUMN published_at TIMESTAMP,
ADD COLUMN scheduled_for TIMESTAMP,
ADD COLUMN visibility visibility DEFAULT 'private' NOT NULL,
ADD COLUMN auto_publish BOOLEAN DEFAULT FALSE,
ADD COLUMN published_by TEXT REFERENCES users(id),
ADD COLUMN unpublished_at TIMESTAMP,
ADD COLUMN unpublished_by TEXT REFERENCES users(id);

-- Create indexes for scene publishing fields
CREATE INDEX idx_scenes_published_at ON scenes(published_at);
CREATE INDEX idx_scenes_scheduled_for ON scenes(scheduled_for);
CREATE INDEX idx_scenes_visibility ON scenes(visibility);
CREATE INDEX idx_scenes_status_visibility ON scenes(visibility);

-- Create publishing_schedules table
CREATE TABLE publishing_schedules (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  schedule_type schedule_type NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  publish_time TEXT DEFAULT '09:00:00' NOT NULL,
  interval_days INTEGER,
  days_of_week JSON,
  scenes_per_publish INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE,
  last_published_at TIMESTAMP,
  next_publish_at TIMESTAMP,
  total_published INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for publishing_schedules
CREATE INDEX idx_publishing_schedules_story ON publishing_schedules(story_id);
CREATE INDEX idx_publishing_schedules_next_publish ON publishing_schedules(next_publish_at);
CREATE INDEX idx_publishing_schedules_active ON publishing_schedules(is_active);

-- Create scheduled_publications table
CREATE TABLE scheduled_publications (
  id TEXT PRIMARY KEY,
  schedule_id TEXT REFERENCES publishing_schedules(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE CASCADE,
  scene_id TEXT REFERENCES scenes(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP NOT NULL,
  published_at TIMESTAMP,
  status publication_status DEFAULT 'pending' NOT NULL,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CHECK (
    (chapter_id IS NOT NULL AND scene_id IS NULL) OR
    (chapter_id IS NULL AND scene_id IS NOT NULL)
  )
);

-- Create indexes for scheduled_publications
CREATE INDEX idx_scheduled_publications_schedule ON scheduled_publications(schedule_id);
CREATE INDEX idx_scheduled_publications_scheduled_for ON scheduled_publications(scheduled_for);
CREATE INDEX idx_scheduled_publications_status ON scheduled_publications(status);
CREATE INDEX idx_scheduled_publications_pending ON scheduled_publications(status, scheduled_for) WHERE status = 'pending';

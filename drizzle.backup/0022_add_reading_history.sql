-- Create reading_history table
CREATE TABLE reading_history (
  id TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP DEFAULT NOW() NOT NULL,
  read_count INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, story_id)
);

-- Create indexes for reading_history
CREATE INDEX idx_reading_history_user ON reading_history(user_id);
CREATE INDEX idx_reading_history_story ON reading_history(story_id);
CREATE INDEX idx_reading_history_last_read ON reading_history(last_read_at DESC);
CREATE INDEX idx_reading_history_user_last_read ON reading_history(user_id, last_read_at DESC);

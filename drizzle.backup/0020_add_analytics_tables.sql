-- Create analytics event type enum
CREATE TYPE event_type AS ENUM (
  'page_view',
  'story_view',
  'chapter_read_start',
  'chapter_read_complete',
  'scene_read',
  'comment_created',
  'comment_liked',
  'story_liked',
  'chapter_liked',
  'post_created',
  'post_viewed',
  'share',
  'bookmark'
);

-- Create session type enum
CREATE TYPE session_type AS ENUM (
  'continuous',
  'interrupted',
  'partial'
);

-- Create insight type enum
CREATE TYPE insight_type AS ENUM (
  'quality_improvement',
  'engagement_drop',
  'reader_feedback',
  'pacing_issue',
  'character_development',
  'plot_consistency',
  'trending_up',
  'publishing_opportunity',
  'audience_mismatch'
);

-- Create analytics_events table
CREATE TABLE analytics_events (
  id TEXT PRIMARY KEY,
  event_type event_type NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE CASCADE,
  scene_id TEXT REFERENCES scenes(id) ON DELETE CASCADE,
  post_id TEXT REFERENCES community_posts(id) ON DELETE CASCADE,
  metadata JSON DEFAULT '{}'::json,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for analytics_events
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_story ON analytics_events(story_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_events_user_timestamp ON analytics_events(user_id, timestamp);

-- Create reading_sessions table
CREATE TABLE reading_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_seconds INTEGER,
  chapters_read INTEGER DEFAULT 0,
  scenes_read INTEGER DEFAULT 0,
  characters_read INTEGER DEFAULT 0,
  session_type session_type DEFAULT 'continuous',
  device_type VARCHAR(20),
  completed_story BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for reading_sessions
CREATE INDEX idx_reading_sessions_user ON reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_story ON reading_sessions(story_id);
CREATE INDEX idx_reading_sessions_start_time ON reading_sessions(start_time);
CREATE INDEX idx_reading_sessions_duration ON reading_sessions(duration_seconds);

-- Create story_insights table
CREATE TABLE story_insights (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  insight_type insight_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'info',
  action_items JSON DEFAULT '[]'::json,
  metrics JSON DEFAULT '{}'::json,
  ai_model VARCHAR(50),
  confidence_score VARCHAR(10),
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP
);

-- Create indexes for story_insights
CREATE INDEX idx_story_insights_story ON story_insights(story_id);
CREATE INDEX idx_story_insights_type ON story_insights(insight_type);
CREATE INDEX idx_story_insights_created ON story_insights(created_at DESC);
CREATE INDEX idx_story_insights_unread ON story_insights(story_id, is_read);

-- Create recommendation_feedback table
CREATE TABLE recommendation_feedback (
  id TEXT PRIMARY KEY,
  insight_id TEXT NOT NULL REFERENCES story_insights(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_taken VARCHAR(50) NOT NULL,
  feedback_text TEXT,
  was_helpful BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for recommendation_feedback
CREATE INDEX idx_recommendation_feedback_insight ON recommendation_feedback(insight_id);
CREATE INDEX idx_recommendation_feedback_user ON recommendation_feedback(user_id);

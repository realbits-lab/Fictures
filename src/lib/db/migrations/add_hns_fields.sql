-- Add HNS fields to stories table
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS premise TEXT,
ADD COLUMN IF NOT EXISTS dramatic_question TEXT,
ADD COLUMN IF NOT EXISTS theme TEXT,
ADD COLUMN IF NOT EXISTS hns_data JSONB;

-- Add HNS fields to parts table
ALTER TABLE parts
ADD COLUMN IF NOT EXISTS structural_role VARCHAR(50),
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS key_beats JSONB,
ADD COLUMN IF NOT EXISTS hns_data JSONB;

-- Add HNS fields to chapters table
ALTER TABLE chapters
ADD COLUMN IF NOT EXISTS pacing_goal VARCHAR(20),
ADD COLUMN IF NOT EXISTS action_dialogue_ratio VARCHAR(10),
ADD COLUMN IF NOT EXISTS chapter_hook JSONB,
ADD COLUMN IF NOT EXISTS hns_data JSONB;

-- Add HNS fields to scenes table
ALTER TABLE scenes
ADD COLUMN IF NOT EXISTS pov_character_id TEXT,
ADD COLUMN IF NOT EXISTS setting_id TEXT,
ADD COLUMN IF NOT EXISTS narrative_voice VARCHAR(50),
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS entry_hook TEXT,
ADD COLUMN IF NOT EXISTS emotional_shift JSONB,
ADD COLUMN IF NOT EXISTS hns_data JSONB;

-- Add settings table (places renamed to match HNS)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  story_id TEXT REFERENCES stories(id) NOT NULL,
  description TEXT,
  mood TEXT,
  sensory JSONB,
  visual_style TEXT,
  visual_references JSONB,
  color_palette JSONB,
  architectural_style TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add HNS fields to characters table
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS role VARCHAR(50),
ADD COLUMN IF NOT EXISTS archetype VARCHAR(100),
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS storyline TEXT,
ADD COLUMN IF NOT EXISTS personality JSONB,
ADD COLUMN IF NOT EXISTS backstory JSONB,
ADD COLUMN IF NOT EXISTS motivations JSONB,
ADD COLUMN IF NOT EXISTS voice JSONB,
ADD COLUMN IF NOT EXISTS physical_description JSONB,
ADD COLUMN IF NOT EXISTS visual_reference_id TEXT,
ADD COLUMN IF NOT EXISTS hns_data JSONB;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_hns_data ON stories USING GIN (hns_data);
CREATE INDEX IF NOT EXISTS idx_parts_hns_data ON parts USING GIN (hns_data);
CREATE INDEX IF NOT EXISTS idx_chapters_hns_data ON chapters USING GIN (hns_data);
CREATE INDEX IF NOT EXISTS idx_scenes_hns_data ON scenes USING GIN (hns_data);
CREATE INDEX IF NOT EXISTS idx_characters_hns_data ON characters USING GIN (hns_data);
CREATE INDEX IF NOT EXISTS idx_settings_story_id ON settings(story_id);
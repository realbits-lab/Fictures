-- Add story development fields to support YAML data storage

-- Add fields to stories table
ALTER TABLE stories ADD COLUMN story_data JSONB;
ALTER TABLE stories ADD COLUMN author_id TEXT REFERENCES users(id);

-- Add fields to parts table  
ALTER TABLE parts ADD COLUMN part_data JSONB;
ALTER TABLE parts ADD COLUMN author_id TEXT REFERENCES users(id);
ALTER TABLE parts ADD COLUMN target_word_count INTEGER DEFAULT 0;
ALTER TABLE parts ADD COLUMN current_word_count INTEGER DEFAULT 0;
ALTER TABLE parts ADD COLUMN status VARCHAR(50) DEFAULT 'planned';

-- Add fields to chapters table for story development
ALTER TABLE chapters ADD COLUMN author_id TEXT REFERENCES users(id);
ALTER TABLE chapters ADD COLUMN purpose TEXT;
ALTER TABLE chapters ADD COLUMN hook TEXT;
ALTER TABLE chapters ADD COLUMN character_focus TEXT;
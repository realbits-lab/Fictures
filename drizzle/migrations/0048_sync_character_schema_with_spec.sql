-- Migration: Synchronize character schema with Adversity-Triumph specification
-- Date: 2025-11-02
-- Purpose: Fix field type mismatches between database and specification

-- 1. Convert backstory from JSON to TEXT
-- For existing legacy stories with JSON backstory, convert to concatenated text
-- For new Adversity-Triumph stories, already using text (will remain unchanged)

-- First, convert any existing JSON backstory to text
UPDATE characters
SET backstory = CASE
    WHEN backstory IS NULL THEN NULL
    WHEN jsonb_typeof(backstory::jsonb) = 'object' THEN
        -- If it's a JSON object, concatenate all values
        (SELECT string_agg(value, E'\n\n')
         FROM jsonb_each_text(backstory::jsonb))
    WHEN jsonb_typeof(backstory::jsonb) = 'string' THEN
        -- If it's already a JSON string, extract the string value
        backstory::jsonb #>> '{}'
    ELSE backstory::text
END::jsonb
WHERE backstory IS NOT NULL
  AND jsonb_typeof(backstory::jsonb) != 'string';

-- Now convert the column type from JSON to TEXT
ALTER TABLE characters
ALTER COLUMN backstory TYPE text USING CASE
    WHEN backstory IS NULL THEN NULL
    WHEN jsonb_typeof(backstory::jsonb) = 'string' THEN backstory::jsonb #>> '{}'
    ELSE backstory::text
END;

-- 2. Add comments to document the schema structure
COMMENT ON COLUMN characters.backstory IS 'Focused history providing motivation context (2-4 paragraphs) - TEXT format per Adversity-Triumph specification';
COMMENT ON COLUMN characters.personality IS 'Character personality with traits[] and values[] - JSON format: {traits: string[], values: string[]}';

-- 3. Mark deprecated legacy fields with comments
COMMENT ON COLUMN characters.content IS 'DEPRECATED - Legacy field, NULL for new Adversity-Triumph stories';
COMMENT ON COLUMN characters.role IS 'DEPRECATED - Legacy field, replaced by summary, NULL for new stories';
COMMENT ON COLUMN characters.archetype IS 'DEPRECATED - Legacy field, NULL for new Adversity-Triumph stories';
COMMENT ON COLUMN characters.storyline IS 'DEPRECATED - Legacy field, NULL for new Adversity-Triumph stories';
COMMENT ON COLUMN characters.motivations IS 'DEPRECATED - Legacy field, replaced by internalFlaw/externalGoal, NULL for new stories';
COMMENT ON COLUMN characters.voice IS 'DEPRECATED - Legacy field, replaced by voiceStyle, NULL for new stories';
COMMENT ON COLUMN characters.visual_reference_id IS 'DEPRECATED - Legacy field, NULL for new Adversity-Triumph stories';

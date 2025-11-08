-- ============================================================================
-- Merged Migration: Complete Schema Updates
-- Date: 2025-11-08
-- Description: Consolidated migration combining all schema updates, cleanups,
--              and optimizations from multiple migration files
-- ============================================================================

-- ============================================================================
-- SECTION 1: DROP DEPRECATED TABLES
-- ============================================================================

-- Drop research table (no longer used, replaced with docs menu)
DROP TABLE IF EXISTS "research" CASCADE;


-- ============================================================================
-- SECTION 2: DROP DEPRECATED FIELDS
-- ============================================================================

-- Drop legacy hns_data indexes
DROP INDEX IF EXISTS idx_stories_hns_data;
DROP INDEX IF EXISTS idx_parts_hns_data;
DROP INDEX IF EXISTS idx_chapters_hns_data;
DROP INDEX IF EXISTS idx_scenes_hns_data;
DROP INDEX IF EXISTS idx_characters_hns_data;

-- Drop hns_data columns from all tables
ALTER TABLE stories DROP COLUMN IF EXISTS hns_data;
ALTER TABLE parts DROP COLUMN IF EXISTS hns_data;
ALTER TABLE chapters DROP COLUMN IF EXISTS hns_data;
ALTER TABLE scenes DROP COLUMN IF EXISTS hns_data;
ALTER TABLE characters DROP COLUMN IF EXISTS hns_data;


-- ============================================================================
-- SECTION 3: CHARACTER SCHEMA UPDATES
-- ============================================================================

-- Convert backstory from JSON to TEXT
-- For existing legacy stories with JSON backstory, convert to concatenated text
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

-- Convert the column type from JSON to TEXT
ALTER TABLE characters
ALTER COLUMN backstory TYPE text USING CASE
    WHEN backstory IS NULL THEN NULL
    WHEN jsonb_typeof(backstory::jsonb) = 'string' THEN backstory::jsonb #>> '{}'
    ELSE backstory::text
END;

-- Add comments to document the schema structure
COMMENT ON COLUMN characters.backstory IS 'Focused history providing motivation context (2-4 paragraphs) - TEXT format per Adversity-Triumph specification';
COMMENT ON COLUMN characters.personality IS 'Character personality with traits[] and values[] - JSON format: {traits: string[], values: string[]}';

-- Drop deprecated columns from characters table
ALTER TABLE characters DROP COLUMN IF EXISTS content;
ALTER TABLE characters DROP COLUMN IF EXISTS role;
ALTER TABLE characters DROP COLUMN IF EXISTS archetype;
ALTER TABLE characters DROP COLUMN IF EXISTS storyline;
ALTER TABLE characters DROP COLUMN IF EXISTS motivations;
ALTER TABLE characters DROP COLUMN IF EXISTS voice;
ALTER TABLE characters DROP COLUMN IF EXISTS visual_reference_id;

-- Add comment explaining schema alignment
COMMENT ON TABLE characters IS 'Character data aligned with Adversity-Triumph Engine specification - deprecated legacy fields removed 2025-11-02';


-- ============================================================================
-- SECTION 4: CHAPTER SCHEMA UPDATES
-- ============================================================================

-- Drop redundant character_focus field from chapters table
ALTER TABLE chapters DROP COLUMN IF EXISTS character_focus;

-- Add comment explaining the alignment
COMMENT ON TABLE chapters IS 'Chapter data aligned with Adversity-Triumph Engine specification - character_focus removed in favor of characterId (single) and focusCharacters (array) - 2025-11-02';


-- ============================================================================
-- SECTION 5: SCENE SCHEMA UPDATES
-- ============================================================================

-- Add setting_id column to scenes table
ALTER TABLE "scenes" ADD COLUMN IF NOT EXISTS "setting_id" text;

-- Add foreign key constraint
DO $$ BEGIN
    ALTER TABLE "scenes" ADD CONSTRAINT "scenes_setting_id_settings_id_fk"
    FOREIGN KEY ("setting_id") REFERENCES "settings"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add comic_toonplay column to scenes table
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS comic_toonplay JSONB;

-- Add comment for documentation
COMMENT ON COLUMN scenes.comic_toonplay IS 'Generated toonplay specification for comic panels - includes panel breakdown with dialogue, SFX, shot types, and visual descriptions';


-- ============================================================================
-- SECTION 6: GENRE TYPE CONVERSION
-- ============================================================================

-- Create the genre enum type
DO $$ BEGIN
  CREATE TYPE genre AS ENUM (
    'Fantasy',
    'Science Fiction',
    'Romance',
    'Mystery',
    'Thriller',
    'Detective',
    'Adventure',
    'Horror',
    'Historical Fiction',
    'Contemporary'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Update existing data to match new enum values
-- Map "Young Adult" to "Contemporary" (closest match)
UPDATE stories
SET genre = 'Contemporary'
WHERE genre = 'Young Adult';

-- Map "Children's Literature" to "Fantasy" (closest match for children's stories)
UPDATE stories
SET genre = 'Fantasy'
WHERE genre = 'Children''s Literature' OR genre = 'Childrens Literature';

-- Ensure all other genres match exactly (case-sensitive)
-- If any genre doesn't match, set to NULL
UPDATE stories
SET genre = NULL
WHERE genre IS NOT NULL
  AND genre NOT IN (
    'Fantasy',
    'Science Fiction',
    'Romance',
    'Mystery',
    'Thriller',
    'Detective',
    'Adventure',
    'Horror',
    'Historical Fiction',
    'Contemporary'
  );

-- Convert the column to use the enum type
ALTER TABLE stories
ALTER COLUMN genre TYPE genre USING genre::genre;

-- Add NOT NULL constraint to genre column
ALTER TABLE stories
ALTER COLUMN genre SET NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN stories.genre IS 'Story genre - required field, must be one of the predefined genre enum values';


-- ============================================================================
-- SECTION 7: REMOVE REDUNDANT FIELDS
-- ============================================================================

-- Remove author_id from chapters table
ALTER TABLE "chapters" DROP COLUMN IF EXISTS "author_id";

-- Remove author_id from parts table
ALTER TABLE "parts" DROP COLUMN IF EXISTS "author_id";

-- Remove word count fields from stories table
ALTER TABLE stories DROP COLUMN IF EXISTS target_word_count;
ALTER TABLE stories DROP COLUMN IF EXISTS current_word_count;

-- Remove word count fields from chapters table
ALTER TABLE chapters DROP COLUMN IF EXISTS word_count;
ALTER TABLE chapters DROP COLUMN IF EXISTS target_word_count;

-- Remove word count fields from scenes table
ALTER TABLE scenes DROP COLUMN IF EXISTS word_count;


-- ============================================================================
-- SECTION 8: ADD PERFORMANCE INDEXES
-- ============================================================================

-- Reading Query Indexes
CREATE INDEX IF NOT EXISTS idx_parts_story_id ON parts(story_id);
CREATE INDEX IF NOT EXISTS idx_parts_order_index ON parts(order_index);
CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id);
CREATE INDEX IF NOT EXISTS idx_chapters_part_id ON chapters(part_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order_index ON chapters(order_index);
CREATE INDEX IF NOT EXISTS idx_chapters_status ON chapters(status);
CREATE INDEX IF NOT EXISTS idx_scenes_chapter_id ON scenes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_scenes_order_index ON scenes(order_index);
CREATE INDEX IF NOT EXISTS idx_scenes_visibility ON scenes(visibility);
CREATE INDEX IF NOT EXISTS idx_scenes_setting_id ON scenes(setting_id);
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_characters_story_id ON characters(story_id);
CREATE INDEX IF NOT EXISTS idx_settings_story_id ON settings(story_id);

-- Community Indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_story_id ON community_posts(story_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_story_created ON community_posts(story_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_status_updated ON stories(status, updated_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_stories_view_count_published ON stories(view_count DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_community_posts_title_search ON community_posts USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_community_posts_content_search ON community_posts USING GIN (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_characters_story_main ON characters(story_id, is_main DESC);

-- Comments Indexes
CREATE INDEX IF NOT EXISTS idx_comments_story_id ON comments(story_id);
CREATE INDEX IF NOT EXISTS idx_comments_chapter_id ON comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_comments_scene_id ON comments(scene_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_story_created ON comments(story_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_chapter_created ON comments(chapter_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_scene_created ON comments(scene_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_user_created ON comments(user_id, created_at);

-- Fuma Comments Indexes
CREATE INDEX IF NOT EXISTS idx_fuma_comments_page ON fuma_comments(page);
CREATE INDEX IF NOT EXISTS idx_fuma_comments_story_id ON fuma_comments(story_id);

-- Scene Comic Toonplay Index
CREATE INDEX IF NOT EXISTS idx_scenes_comic_toonplay ON scenes USING GIN (comic_toonplay);

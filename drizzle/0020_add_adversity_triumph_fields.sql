-- Migration: Add Adversity-Triumph Engine fields to schema
-- Date: 2025-10-31
-- Purpose: Align database schema with docs/novels/novels-specification.md

-- ============================================================================
-- STEP 1: Create new enums
-- ============================================================================

-- Tone enum for stories
CREATE TYPE tone AS ENUM ('hopeful', 'dark', 'bittersweet', 'satirical');

-- Arc position enum for chapters
CREATE TYPE arc_position AS ENUM ('beginning', 'middle', 'climax', 'resolution');

-- Adversity type enum for chapters
CREATE TYPE adversity_type AS ENUM ('internal', 'external', 'both');

-- Virtue type enum for chapters
CREATE TYPE virtue_type AS ENUM ('courage', 'compassion', 'integrity', 'sacrifice', 'loyalty', 'wisdom');

-- Cycle phase enum for scenes
CREATE TYPE cycle_phase AS ENUM ('setup', 'confrontation', 'virtue', 'consequence', 'transition');

-- Emotional beat enum for scenes
CREATE TYPE emotional_beat AS ENUM ('fear', 'hope', 'tension', 'relief', 'elevation', 'catharsis', 'despair', 'joy');

-- ============================================================================
-- STEP 2: Add fields to stories table
-- ============================================================================

-- Add Adversity-Triumph core fields to stories
ALTER TABLE stories ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS tone tone;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS "moralFramework" TEXT;

-- Add comments for documentation
COMMENT ON COLUMN stories.summary IS 'General thematic premise and moral framework for the story';
COMMENT ON COLUMN stories.tone IS 'Overall emotional direction: hopeful, dark, bittersweet, or satirical';
COMMENT ON COLUMN stories."moralFramework" IS 'What virtues are valued and what vices are punished in this story world';

-- ============================================================================
-- STEP 3: Add fields to parts table
-- ============================================================================

-- Add Adversity-Triumph fields to parts
ALTER TABLE parts ADD COLUMN IF NOT EXISTS "actNumber" INTEGER;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS "characterArcs" JSONB;

-- Add comments
COMMENT ON COLUMN parts."actNumber" IS 'Act number (1, 2, or 3) in three-act structure';
COMMENT ON COLUMN parts."characterArcs" IS 'Array of macro adversity-triumph arcs for each character in this act';

-- ============================================================================
-- STEP 4: Add fields to chapters table
-- ============================================================================

-- Add Adversity-Triumph cycle tracking to chapters
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS "characterId" TEXT;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS "arcPosition" arc_position;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS "contributesToMacroArc" TEXT;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS "focusCharacters" JSONB DEFAULT '[]';
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS "adversityType" adversity_type;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS "virtueType" virtue_type;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS "seedsPlanted" JSONB DEFAULT '[]';
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS "seedsResolved" JSONB DEFAULT '[]';
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS "connectsToPreviousChapter" TEXT;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS "createsNextAdversity" TEXT;

-- Add foreign key constraint for characterId
ALTER TABLE chapters ADD CONSTRAINT chapters_character_id_fkey
  FOREIGN KEY ("characterId") REFERENCES characters(id) ON DELETE SET NULL;

-- Add comments
COMMENT ON COLUMN chapters."characterId" IS 'Primary character whose macro arc this chapter advances';
COMMENT ON COLUMN chapters."arcPosition" IS 'Position in macro arc: beginning, middle, climax (MACRO moment), or resolution';
COMMENT ON COLUMN chapters."contributesToMacroArc" IS 'How this chapter advances the character macro transformation';
COMMENT ON COLUMN chapters."focusCharacters" IS 'Array of character IDs featured in this chapter';
COMMENT ON COLUMN chapters."adversityType" IS 'Type of conflict: internal, external, or both';
COMMENT ON COLUMN chapters."virtueType" IS 'Moral virtue tested: courage, compassion, integrity, sacrifice, loyalty, or wisdom';
COMMENT ON COLUMN chapters."seedsPlanted" IS 'Array of setups that will pay off in future chapters';
COMMENT ON COLUMN chapters."seedsResolved" IS 'Array of past setups that pay off in this chapter';
COMMENT ON COLUMN chapters."connectsToPreviousChapter" IS 'How previous chapter resolution created this adversity';
COMMENT ON COLUMN chapters."createsNextAdversity" IS 'How this chapter resolution creates next problem';

-- ============================================================================
-- STEP 5: Add fields to scenes table
-- ============================================================================

-- Add Adversity-Triumph phase tracking to scenes
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS "cyclePhase" cycle_phase;
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS "emotionalBeat" emotional_beat;

-- Add comments
COMMENT ON COLUMN scenes."cyclePhase" IS 'Position in 4-phase cycle: setup, confrontation, virtue, consequence, or transition';
COMMENT ON COLUMN scenes."emotionalBeat" IS 'Target emotion: fear, hope, tension, relief, elevation, catharsis, despair, or joy';

-- ============================================================================
-- STEP 6: Add fields to characters table
-- ============================================================================

-- Add Adversity-Triumph core character fields
ALTER TABLE characters ADD COLUMN IF NOT EXISTS "coreTrait" TEXT;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS "internalFlaw" TEXT;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS "externalGoal" TEXT;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS relationships JSONB;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS "voiceStyle" JSONB;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS "visualStyle" TEXT;

-- Add comments
COMMENT ON COLUMN characters."coreTrait" IS 'THE defining moral virtue that drives virtue scenes: courage, compassion, integrity, loyalty, wisdom, or sacrifice';
COMMENT ON COLUMN characters."internalFlaw" IS 'Source of adversity - MUST include cause: [fears/believes/wounded by] X because Y';
COMMENT ON COLUMN characters."externalGoal" IS 'What character THINKS will solve their problem (healing flaw is actual solution)';
COMMENT ON COLUMN characters.relationships IS 'Jeong system tracking: {[characterId]: {type, jeongLevel, sharedHistory, currentDynamic}}';
COMMENT ON COLUMN characters."voiceStyle" IS 'Dialogue generation guide: {tone, vocabulary, quirks, emotionalRange}';
COMMENT ON COLUMN characters."visualStyle" IS 'Visual aesthetic for portrait generation: realistic, anime, painterly, or cinematic';

-- ============================================================================
-- STEP 7: Add fields to settings table
-- ============================================================================

-- Add Adversity-Triumph environmental fields to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS "adversityElements" JSONB;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS "symbolicMeaning" TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS "cycleAmplification" JSONB;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS "emotionalResonance" TEXT;

-- Add comments
COMMENT ON COLUMN settings."adversityElements" IS 'External conflict sources: {physicalObstacles, scarcityFactors, dangerSources, socialDynamics}';
COMMENT ON COLUMN settings."symbolicMeaning" IS 'How setting reflects story moral framework (1-2 sentences)';
COMMENT ON COLUMN settings."cycleAmplification" IS 'How setting amplifies each cycle phase: {setup, confrontation, virtue, consequence, transition}';
COMMENT ON COLUMN settings."emotionalResonance" IS 'Primary emotion this setting amplifies: isolation, hope, fear, connection, etc.';

-- ============================================================================
-- STEP 8: Create indexes for better query performance
-- ============================================================================

-- Index for chapter cycle tracking
CREATE INDEX IF NOT EXISTS idx_chapters_character_id ON chapters("characterId");
CREATE INDEX IF NOT EXISTS idx_chapters_arc_position ON chapters("arcPosition");
CREATE INDEX IF NOT EXISTS idx_chapters_virtue_type ON chapters("virtueType");

-- Index for scene cycle tracking
CREATE INDEX IF NOT EXISTS idx_scenes_cycle_phase ON scenes("cyclePhase");
CREATE INDEX IF NOT EXISTS idx_scenes_emotional_beat ON scenes("emotionalBeat");

-- Index for character relationships
CREATE INDEX IF NOT EXISTS idx_characters_is_main ON characters("is_main");
CREATE INDEX IF NOT EXISTS idx_characters_core_trait ON characters("coreTrait");

-- Index for story tone
CREATE INDEX IF NOT EXISTS idx_stories_tone ON stories(tone);

-- ============================================================================
-- STEP 9: Data migration for existing records (optional - commented out)
-- ============================================================================

-- Uncomment these if you want to migrate existing data

-- Migrate stories.summary from legacy fields
-- UPDATE stories
-- SET summary = CONCAT_WS(' | ', premise, dramatic_question, theme)
-- WHERE summary IS NULL AND (premise IS NOT NULL OR dramatic_question IS NOT NULL OR theme IS NOT NULL);

-- Set default tone for existing stories
-- UPDATE stories SET tone = 'hopeful' WHERE tone IS NULL;

-- Set default actNumber from orderIndex for existing parts
-- UPDATE parts SET "actNumber" = order_index + 1 WHERE "actNumber" IS NULL AND order_index < 3;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration complete!
-- Next steps:
-- 1. Update src/lib/db/schema.ts to match these changes
-- 2. Update TypeScript types in src/lib/novels/types.ts
-- 3. Update generation APIs to populate new fields
-- 4. Test with new story generation

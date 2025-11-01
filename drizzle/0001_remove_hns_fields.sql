-- Migration: Remove HNS-specific fields while keeping shared fields used by Novels
-- Date: 2025-11-01
-- Reason: HNS system deprecated, replaced by Adversity-Triumph Engine (Novels)

-- ============================================================================
-- STORIES TABLE - Remove only hns_data
-- ============================================================================
-- KEEP: premise, dramatic_question, theme (legacy fields for migration)
ALTER TABLE stories DROP COLUMN IF EXISTS hns_data;
DROP INDEX IF EXISTS idx_stories_hns_data;

-- ============================================================================
-- PARTS TABLE - Remove HNS-specific fields
-- ============================================================================
-- KEEP: summary, structural_role (used for migration/reference)
ALTER TABLE parts
  DROP COLUMN IF EXISTS key_beats,
  DROP COLUMN IF EXISTS hns_data;
DROP INDEX IF EXISTS idx_parts_hns_data;

-- ============================================================================
-- CHAPTERS TABLE - Remove ALL HNS fields
-- ============================================================================
-- All HNS chapter fields are unused by Novels
ALTER TABLE chapters
  DROP COLUMN IF EXISTS pacing_goal,
  DROP COLUMN IF EXISTS action_dialogue_ratio,
  DROP COLUMN IF EXISTS chapter_hook,
  DROP COLUMN IF EXISTS hns_data;
DROP INDEX IF EXISTS idx_chapters_hns_data;

-- ============================================================================
-- SCENES TABLE - Remove HNS-specific fields
-- ============================================================================
-- KEEP: summary (Novels uses it with different meaning)
ALTER TABLE scenes
  DROP COLUMN IF EXISTS pov_character_id,
  DROP COLUMN IF EXISTS setting_id,
  DROP COLUMN IF EXISTS narrative_voice,
  DROP COLUMN IF EXISTS entry_hook,
  DROP COLUMN IF EXISTS emotional_shift,
  DROP COLUMN IF EXISTS hns_data;
DROP INDEX IF EXISTS idx_scenes_hns_data;

-- ============================================================================
-- CHARACTERS TABLE - Remove only hns_data
-- ============================================================================
-- KEEP: All other fields (personality, backstory, voice, etc. - used by Novels)
ALTER TABLE characters DROP COLUMN IF EXISTS hns_data;
DROP INDEX IF EXISTS idx_characters_hns_data;

-- ============================================================================
-- SETTINGS TABLE - KEEP ENTIRE TABLE
-- ============================================================================
-- Settings table is NOT HNS-specific - it's core to Adversity-Triumph Engine
-- DO NOT DROP this table!

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify hns_data columns dropped from all tables
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'hns_data';
-- Expected: 0 rows

-- Verify HNS-specific indexes dropped
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%hns%';
-- Expected: 0 rows

-- Verify settings table still exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'settings';
-- Expected: 1 row (settings table MUST exist)

-- Verify shared fields kept in characters
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'characters'
  AND column_name IN ('personality', 'backstory', 'voice', 'physical_description');
-- Expected: 4 rows (all kept)

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Dropped: hns_data from 5 tables (stories, parts, chapters, scenes, characters)
-- - Dropped: key_beats from parts
-- - Dropped: pacing_goal, action_dialogue_ratio, chapter_hook from chapters
-- - Dropped: pov_character_id, setting_id, narrative_voice, entry_hook, emotional_shift from scenes
-- - Kept: All shared fields used by Novels system
-- - Kept: Settings table (core to Adversity-Triumph Engine)

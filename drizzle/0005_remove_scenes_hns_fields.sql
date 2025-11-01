-- Migration: Remove HNS-specific fields from scenes table
-- Date: 2025-11-01
-- Reason: goal, conflict, outcome are HNS fields, always empty, not used by Novels

-- ============================================================================
-- SCENES TABLE ANALYSIS
-- ============================================================================
-- HNS (Hook-Nurture-Satisfy) fields - ALWAYS EMPTY:
--   ❌ goal - Scene dramatic goal (HNS planning field)
--   ❌ conflict - Scene conflict description (HNS planning field)
--   ❌ outcome - Scene outcome description (HNS planning field)
--
-- Novels (Adversity-Triumph Engine) fields - ACTIVELY USED:
--   ✓ cyclePhase - setup, confrontation, virtue, consequence, transition
--   ✓ emotionalBeat - fear, despair, elevation, etc.
--   ✓ evaluationScore - Quality score from scene evaluation
--   ✓ content - Full narrative text
--
-- The Novels system uses cyclePhase and emotionalBeat instead of goal/conflict/outcome

-- ============================================================================
-- REMOVE HNS FIELDS
-- ============================================================================

ALTER TABLE scenes
  DROP COLUMN IF EXISTS goal,
  DROP COLUMN IF EXISTS conflict,
  DROP COLUMN IF EXISTS outcome;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify fields dropped
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'scenes'
  AND column_name IN ('goal', 'conflict', 'outcome');
-- Expected: 0 rows

-- Verify Novels fields still exist
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'scenes'
  AND column_name IN ('cyclePhase', 'emotionalBeat', 'evaluationScore', 'content');
-- Expected: 4 rows

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Removed from scenes table:
--   - goal (HNS planning field, always empty)
--   - conflict (HNS planning field, always empty)
--   - outcome (HNS planning field, always empty)
--
-- Kept in scenes table:
--   - cyclePhase (Novels: setup, confrontation, virtue, etc.)
--   - emotionalBeat (Novels: fear, despair, elevation, etc.)
--   - evaluationScore (Novels: quality assessment score)
--   - content (full narrative text)

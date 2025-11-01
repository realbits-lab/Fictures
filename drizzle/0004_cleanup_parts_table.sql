-- Migration: Clean up parts table - remove unused fields and duplicates
-- Date: 2025-11-01
-- Reason: Remove HNS-specific fields and duplicate order tracking fields

-- ============================================================================
-- PARTS TABLE ANALYSIS
-- ============================================================================
-- Current usage by Novels system:
--   ✓ id, title, summary, storyId, authorId - Core fields (used)
--   ✓ actNumber - Act number (1, 2, 3) - USED by Novels
--   ✓ orderIndex - Zero-based index (0, 1, 2) - DUPLICATES actNumber
--   ✓ characterArcs - Novels-specific macro arcs (used)
--   ✓ createdAt, updatedAt - Timestamps (used)
--
--   ❌ description - Always empty, not used by Novels
--   ❌ target_word_count - Always null, not used by Novels
--   ❌ current_word_count - Always null, not used by Novels
--   ❌ content - Always empty, not used by Novels
--   ❌ structural_role - Always empty, not used by Novels
--
-- DUPLICATION ISSUE:
--   actNumber and orderIndex track the same thing:
--   - actNumber: 1, 2, 3 (human-readable act number)
--   - orderIndex: 0, 1, 2 (zero-based index)
--   - Keep actNumber (more semantic, already used in generation)
--   - Remove orderIndex (can be derived: actNumber - 1)

-- ============================================================================
-- REMOVE UNUSED FIELDS
-- ============================================================================

ALTER TABLE parts
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS target_word_count,
  DROP COLUMN IF EXISTS current_word_count,
  DROP COLUMN IF EXISTS content,
  DROP COLUMN IF EXISTS structural_role,
  DROP COLUMN IF EXISTS order_index;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify fields dropped
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'parts'
  AND column_name IN ('description', 'target_word_count', 'current_word_count', 'content', 'structural_role', 'order_index');
-- Expected: 0 rows

-- Verify Novels fields still exist
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'parts'
  AND column_name IN ('id', 'title', 'summary', 'actNumber', 'characterArcs');
-- Expected: 5 rows

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Removed from parts table:
--   - description (HNS field, always empty)
--   - target_word_count (not used by Novels)
--   - current_word_count (not used by Novels)
--   - content (HNS field, always empty)
--   - structural_role (HNS field, always empty)
--   - order_index (duplicates actNumber)
--
-- Kept in parts table:
--   - id, title, summary (core fields)
--   - storyId, authorId (foreign keys)
--   - actNumber (1-based act number, semantic)
--   - characterArcs (Novels macro arcs)
--   - createdAt, updatedAt (timestamps)

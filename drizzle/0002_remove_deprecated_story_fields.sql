-- Migration: Remove deprecated story fields not used by Novels
-- Date: 2025-11-01
-- Reason: These fields were HNS-specific or unused by Adversity-Triumph Engine

-- ============================================================================
-- STORIES TABLE - Remove deprecated/unused fields
-- ============================================================================

-- Remove HNS-specific fields
ALTER TABLE stories
  DROP COLUMN IF EXISTS description,    -- Not used by Novels (always empty)
  DROP COLUMN IF EXISTS content,        -- HNS YAML data storage (not used by Novels)
  DROP COLUMN IF EXISTS premise,        -- Legacy HNS field
  DROP COLUMN IF EXISTS dramatic_question,  -- Legacy HNS field
  DROP COLUMN IF EXISTS theme;          -- Legacy HNS field (Novels uses moralFramework instead)

-- KEEP: tags - common metadata field that may be useful for future features

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify fields dropped
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'stories'
  AND column_name IN ('description', 'content', 'premise', 'dramatic_question', 'theme');
-- Expected: 0 rows

-- Verify Novels fields still exist
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'stories'
  AND column_name IN ('summary', 'tone', 'moral_framework');
-- Expected: 3 rows

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Removed: description, content, premise, dramatic_question, theme from stories
-- Kept: tags (useful for metadata/search)
-- Novels uses: summary, tone, moralFramework (all preserved)

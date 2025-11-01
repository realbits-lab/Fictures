-- Migration: Remove tags field from stories table
-- Date: 2025-11-01
-- Reason: Field is never populated by Novel generation system and always empty

-- ============================================================================
-- STORIES TABLE - Remove unused tags field
-- ============================================================================

-- Remove tags field (always empty, not used by Novels)
ALTER TABLE stories
  DROP COLUMN IF EXISTS tags;

-- Note: communityPosts and research tables have their own separate tags fields
-- which are actively used and should NOT be removed

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tags field dropped from stories
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'stories'
  AND column_name = 'tags';
-- Expected: 0 rows

-- Verify tags still exist in other tables (should remain)
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'tags'
  AND table_name IN ('community_posts', 'research');
-- Expected: 2 rows

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Removed: tags from stories table
-- Kept: tags in community_posts and research tables (actively used)

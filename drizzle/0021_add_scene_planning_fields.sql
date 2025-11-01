-- Migration: Add scene planning metadata fields
-- Date: 2025-11-01
-- Purpose: Add characterFocus, sensoryAnchors, dialogueVsDescription, suggestedLength to scenes table
-- Related: docs/novels/novels-specification.md section 3.6

-- ============================================================================
-- STEP 1: Add planning metadata fields to scenes table
-- ============================================================================

-- Add character focus tracking (which characters appear in this scene)
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS "characterFocus" JSONB DEFAULT '[]';

-- Add sensory anchor guidance (specific sensory details to include)
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS "sensoryAnchors" JSONB DEFAULT '[]';

-- Add dialogue vs description balance guidance
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS "dialogueVsDescription" TEXT;

-- Add suggested length guidance for content generation
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS "suggestedLength" TEXT;

-- ============================================================================
-- STEP 2: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN scenes."characterFocus" IS 'Array of character IDs appearing in this scene';
COMMENT ON COLUMN scenes."sensoryAnchors" IS 'Array of key sensory details to include in prose (e.g., "rain on metal roof", "smell of smoke")';
COMMENT ON COLUMN scenes."dialogueVsDescription" IS 'Balance guidance for content generation (e.g., "60% dialogue, 40% description")';
COMMENT ON COLUMN scenes."suggestedLength" IS 'Target word count range: short (300-500), medium (500-800), or long (800-1000)';

-- ============================================================================
-- STEP 3: Create indexes for query performance (optional)
-- ============================================================================

-- Index for character focus queries (finding scenes by character)
CREATE INDEX IF NOT EXISTS idx_scenes_character_focus ON scenes USING GIN ("characterFocus");

-- Index for suggested length (finding scenes by pacing)
CREATE INDEX IF NOT EXISTS idx_scenes_suggested_length ON scenes("suggestedLength");

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration complete!
-- Next steps:
-- 1. Update drizzle/schema.ts to include these fields
-- 2. Update scene generation APIs to populate these fields
-- 3. Update scene content generation to use these planning metadata

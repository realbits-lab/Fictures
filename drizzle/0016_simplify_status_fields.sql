-- Simplify status fields across tables

-- Drop the old enums
DROP TYPE IF EXISTS "story_generation_status" CASCADE;
DROP TYPE IF EXISTS "chapter_status" CASCADE;

-- Create new unified status enum
CREATE TYPE "status" AS ENUM ('writing', 'published');

-- Remove status from parts table
ALTER TABLE "parts" DROP COLUMN IF EXISTS "status";

-- Remove status from scenes table
ALTER TABLE "scenes" DROP COLUMN IF EXISTS "status";

-- Update stories table to use new enum
ALTER TABLE "stories"
  ALTER COLUMN "status" TYPE "status"
  USING CASE
    WHEN "status"::text IN ('draft', 'phase1_in_progress', 'phase1_complete', 'phase2_complete',
                             'phase3_complete', 'phase4_complete', 'phase5_6_complete',
                             'analyzing_quality', 'analysis_complete', 'improving_content',
                             'improvement_complete', 'generating_character_images',
                             'character_images_complete', 'generating_setting_images',
                             'setting_images_complete', 'failed', 'active', 'hiatus', 'archived')
    THEN 'writing'::status
    WHEN "status"::text = 'completed'
    THEN 'published'::status
    ELSE 'writing'::status
  END;

-- Update chapters table to use new enum
ALTER TABLE "chapters"
  ALTER COLUMN "status" TYPE "status"
  USING CASE
    WHEN "status"::text = 'completed'
    THEN 'published'::status
    ELSE 'writing'::status
  END;
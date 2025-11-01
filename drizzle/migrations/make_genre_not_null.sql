-- Migration: Make genre field NOT NULL
-- This migration adds a NOT NULL constraint to the genre column in stories table
-- Prerequisite: All existing stories must have a valid genre value (no NULLs)

-- Add NOT NULL constraint to genre column
ALTER TABLE stories
ALTER COLUMN genre SET NOT NULL;

-- Add comment to document the constraint
COMMENT ON COLUMN stories.genre IS 'Story genre - required field, must be one of the predefined genre enum values';

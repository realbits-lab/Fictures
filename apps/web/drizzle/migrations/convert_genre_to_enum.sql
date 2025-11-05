-- Migration: Convert genre field from varchar to enum
-- This migration:
-- 1. Creates a new genre enum type
-- 2. Updates existing data to match enum values (map old genres to new ones)
-- 3. Converts the genre column to use the enum type
-- 4. Removes deprecated genres (Young Adult, Children's Literature)

-- Step 1: Create the genre enum type
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
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Update existing data to match new enum values
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

-- Step 3: Convert the column to use the enum type
-- First, alter the column to use the new enum type using a CAST
ALTER TABLE stories
ALTER COLUMN genre TYPE genre USING genre::genre;

-- Step 4: Add comment to document the change
COMMENT ON COLUMN stories.genre IS 'Story genre - must be one of the predefined genre enum values';

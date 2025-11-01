-- Migration: Remove word count fields from stories, chapters, and scenes tables
-- Date: 2025-11-01

-- Remove word count fields from stories table
ALTER TABLE stories DROP COLUMN IF EXISTS target_word_count;
ALTER TABLE stories DROP COLUMN IF EXISTS current_word_count;

-- Remove word count fields from chapters table
ALTER TABLE chapters DROP COLUMN IF EXISTS word_count;
ALTER TABLE chapters DROP COLUMN IF EXISTS target_word_count;

-- Remove word count fields from scenes table
ALTER TABLE scenes DROP COLUMN IF EXISTS word_count;

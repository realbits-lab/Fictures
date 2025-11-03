-- Migration: Drop redundant character_focus field from chapters table
-- Date: 2025-11-02
-- Purpose: Remove legacy HNS field in favor of Adversity-Triumph Engine fields

-- According to novels specification (section 3.5 Chapter Schema):
-- - character_id (single ID) - primary character whose macro arc this chapter advances
-- - focus_characters (array) - all character IDs featured in this chapter
-- - character_focus (text) - DEPRECATED HNS field, replaced by focus_characters array

-- Drop the redundant column
ALTER TABLE chapters DROP COLUMN IF EXISTS character_focus;

-- Add comment explaining the alignment
COMMENT ON TABLE chapters IS 'Chapter data aligned with Adversity-Triumph Engine specification - character_focus removed in favor of characterId (single) and focusCharacters (array) - 2025-11-02';

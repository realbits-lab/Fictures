-- Migration: Remove unused scene fields (character_ids, place_ids)
-- Description: These fields were from an earlier design iteration and are not used by the Adversity-Triumph Engine
-- The specification uses character_focus, sensory_anchors, dialogue_vs_description, and suggested_length instead

ALTER TABLE scenes DROP COLUMN IF EXISTS character_ids CASCADE;
ALTER TABLE scenes DROP COLUMN IF EXISTS place_ids CASCADE;

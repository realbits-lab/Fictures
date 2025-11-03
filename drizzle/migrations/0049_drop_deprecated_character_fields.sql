-- Migration: Drop deprecated HNS character fields
-- Date: 2025-11-02
-- Purpose: Remove legacy HNS fields that are not used in Adversity-Triumph generation

-- Drop deprecated columns from characters table
ALTER TABLE characters DROP COLUMN IF EXISTS content;
ALTER TABLE characters DROP COLUMN IF EXISTS role;
ALTER TABLE characters DROP COLUMN IF EXISTS archetype;
ALTER TABLE characters DROP COLUMN IF EXISTS storyline;
ALTER TABLE characters DROP COLUMN IF EXISTS motivations;
ALTER TABLE characters DROP COLUMN IF EXISTS voice;
ALTER TABLE characters DROP COLUMN IF EXISTS visual_reference_id;

-- Add comment explaining schema alignment
COMMENT ON TABLE characters IS 'Character data aligned with Adversity-Triumph Engine specification - deprecated HNS fields removed 2025-11-02';

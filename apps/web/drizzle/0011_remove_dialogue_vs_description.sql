-- Migration: Remove dialogue_vs_description column from scenes table
-- Reason: Replaced with fixed 40-60% dialogue ratio for all scenes (v1.2)
-- Date: 2024-11-21

ALTER TABLE scenes DROP COLUMN IF EXISTS dialogue_vs_description;

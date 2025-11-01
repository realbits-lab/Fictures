-- Migration: Remove legacy places table
-- Description: Remove unused places table, replaced by settings table in Novels system
-- Date: 2025-01-01
-- Related: HNS system cleanup

-- The places table was part of the legacy HNS system
-- It has been replaced by the settings table in the Adversity-Triumph Engine (Novels system)
-- The settings table includes additional fields for adversity elements and emotional resonance

DROP TABLE IF EXISTS places CASCADE;

-- Migration: Update cycle_phase enum from 'confrontation' to 'adversity'
-- Date: 2025-11-15
-- Description: Rename 'confrontation' value to 'adversity' in cycle_phase enum type

ALTER TYPE cycle_phase RENAME VALUE 'confrontation' TO 'adversity';

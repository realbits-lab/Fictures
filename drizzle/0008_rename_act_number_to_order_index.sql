-- Migration: Rename act_number to order_index in parts table
-- Description: Unify ordering column naming across tables (parts, chapters, scenes all use order_index)
-- Date: 2025-01-01
-- Related: Naming convention unification

-- Rename act_number to order_index for consistency
-- parts.order_index will store: 0, 1, 2 (for acts 1, 2, 3)
-- chapters.order_index stores chapter position within story
-- scenes.order_index stores scene position within chapter

ALTER TABLE parts RENAME COLUMN act_number TO order_index;

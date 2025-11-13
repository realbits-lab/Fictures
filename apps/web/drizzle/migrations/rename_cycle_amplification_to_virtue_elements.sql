-- Migration: Rename cycle_amplification to virtue_elements in settings table
-- Created: 2025-11-14
--
-- This migration renames the cycle_amplification column to virtue_elements
-- to better reflect its purpose in the Adversity-Triumph Engine

-- Rename the column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'settings'
        AND column_name = 'cycle_amplification'
    ) THEN
        ALTER TABLE settings
        RENAME COLUMN cycle_amplification TO virtue_elements;

        RAISE NOTICE 'Column renamed from cycle_amplification to virtue_elements';
    ELSE
        -- If cycle_amplification doesn't exist, add virtue_elements as new column
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'settings'
            AND column_name = 'virtue_elements'
        ) THEN
            ALTER TABLE settings
            ADD COLUMN virtue_elements jsonb NOT NULL DEFAULT '{"witnessElements":[],"contrastElements":[],"opportunityElements":[],"sacredSpaces":[]}'::jsonb;

            RAISE NOTICE 'Column virtue_elements added as new column';
        ELSE
            RAISE NOTICE 'Column virtue_elements already exists, no action needed';
        END IF;
    END IF;
END $$;

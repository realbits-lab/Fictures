-- Fix reading_history table constraints
-- Change from composite PK (user_id, story_id) to id as PK + unique constraint

-- Step 1: Drop the existing composite primary key
ALTER TABLE reading_history DROP CONSTRAINT reading_history_pkey;

-- Step 2: Make id the primary key
ALTER TABLE reading_history ADD PRIMARY KEY (id);

-- Step 3: Add unique constraint on (user_id, story_id) to prevent duplicates
ALTER TABLE reading_history ADD CONSTRAINT user_story_unique UNIQUE (user_id, story_id);

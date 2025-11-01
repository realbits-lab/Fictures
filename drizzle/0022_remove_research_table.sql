-- Remove research table and related constraints
-- This table was used for research notes and documentation but is no longer needed

-- Drop the research table (foreign key constraints will be automatically dropped due to CASCADE)
DROP TABLE IF EXISTS "research" CASCADE;

-- Note: The research table had a foreign key to users table
-- The CASCADE option ensures all dependent objects are also dropped

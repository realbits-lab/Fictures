-- Add new phase1_in_progress status to replace generic 'generating'
ALTER TYPE story_generation_status ADD VALUE IF NOT EXISTS 'phase1_in_progress' AFTER 'draft';

-- Update any existing 'generating' status to 'phase1_in_progress'
UPDATE stories
SET status = 'phase1_in_progress'::story_generation_status
WHERE status = 'generating'::story_generation_status;

-- Note: PostgreSQL doesn't allow removing enum values easily
-- The 'generating' value is now deprecated and should not be used
-- It will remain in the enum but is no longer used by the application
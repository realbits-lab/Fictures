-- ==========================================
-- SET ALL CONTENT TO PUBLISHED/PUBLIC STATUS
-- ==========================================

BEGIN;

-- Set all stories to published and public
UPDATE stories SET 
  status = 'published',
  is_public = true
WHERE id IN (
  'IiE1KTLwsDAVJvzEVzoRi', -- The Last Guardian
  'A97aQ6OzNmOoCJ1svugJY', -- Mirrors of Reality  
  'uzvfKaRxAgNzIW1tRreGb', -- The Digital Awakening
  '80vieT0wFruX4X72pnDGa', -- Debugging Realities
  '-jXD7WeWP6axZIvlpdqry', -- Echoes of Tomorrow
  'yWzfrPc85xT0SfF3rzxjU'  -- Digital Nexus: The Code Between Worlds
);

-- Set all parts to completed status
UPDATE parts SET status = 'completed';

-- Set all chapters to published status
UPDATE chapters SET status = 'published';

-- Set all scenes to completed status  
UPDATE scenes SET status = 'completed';

COMMIT;
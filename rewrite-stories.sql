-- COMPREHENSIVE STORY REWRITE SCRIPT
-- This script will rewrite all stories with rich, detailed content

BEGIN;

-- ==========================================
-- 1. THE LAST GUARDIAN (Epic Fantasy)
-- ==========================================

-- Update main story
UPDATE stories SET 
  description = 'In a world where ancient magical artifacts keep primordial darkness at bay, Lyra Thornwick discovers she is the last of an order of mystical guardians. When she uncovers a conspiracy that led to her order''s destruction, she must master forbidden powers, forge unlikely alliances, and prevent the return of the Void Wraiths - ancient entities that would consume all light and life. A tale of betrayal, redemption, and the true cost of protecting those who cannot protect themselves.',
  genre = 'Epic Fantasy',
  status = 'published',
  is_public = true,
  current_word_count = 2500
WHERE id = 'IiE1KTLwsDAVJvzEVzoRi';

-- Update parts with meaningful titles and descriptions
UPDATE parts SET 
  title = 'Part I: The Last Light',
  description = 'Lyra Thornwick discovers her heritage as the last Guardian when the protective wards begin to fail. She must accept her destiny and begin learning the ancient ways while dark forces gather strength.'
WHERE id = 'jUv3XDo2FhiAvRpHoxEXT';

UPDATE parts SET 
  title = 'Part II: Shadows of Betrayal', 
  description = 'As Lyra''s powers grow, she uncovers the truth about her order''s fall. Betrayed by those she trusted, she must navigate political intrigue while preparing for the coming darkness.'
WHERE id = '4MgOWu--24R8qaC27PFDl';

UPDATE parts SET 
  title = 'Part III: Dawn of the Guardian',
  description = 'The final confrontation approaches. Lyra must master the ultimate Guardian technique and make the greatest sacrifice to seal away the Void Wraiths forever.'
WHERE id = 'FMlV_kUx1ev2-JPpwuFlm';

-- Update chapters with compelling titles and summaries
UPDATE chapters SET 
  title = 'The Failing Light',
  summary = 'When the protective wards around the village of Millbrook begin to flicker and fail, young scholar Lyra Thornwick discovers an ancient medallion that burns with mysterious power. As shadow creatures emerge from the darkened woods, Lyra''s grandmother reveals the truth: Lyra is the last of the Guardian order, keepers of artifacts that have held back primordial darkness for millennia.',
  status = 'published',
  word_count = 850,
  purpose = 'Establish the world, introduce Lyra, and reveal her Guardian heritage',
  hook = 'The protective barrier fails just as ancient evils begin to stir',
  character_focus = 'Lyra Thornwick - discovering her destiny'
WHERE id = 'mxsk2Vk6BWO-eqtfMOUyZ';

UPDATE chapters SET 
  title = 'The Conspiracy Unveiled', 
  summary = 'Lyra''s training is interrupted when she discovers coded messages revealing that her order was not destroyed by external enemies, but betrayed from within. Lord Commander Aldric Vane, who she believed was helping her, is actually working with the Void Wraiths. She must escape his trap while protecting the remaining Guardian artifacts from falling into enemy hands.',
  status = 'published',
  word_count = 900,
  purpose = 'Major plot twist - reveal the betrayal and raise stakes',
  hook = 'The mentor figure is revealed as the primary antagonist',
  character_focus = 'Lyra - dealing with betrayal and growing stronger'
WHERE id = '0di1cGRyljh60ufz44wtb';

UPDATE chapters SET 
  title = 'The Last Stand',
  summary = 'With all Guardian artifacts gathered, Lyra faces the Void Wraiths in the ancient Sanctuary of Eternal Light. She must perform the Seal of Binding, a technique that will trap the entities forever but requires the Guardian to sacrifice their connection to the mortal world. In a climactic battle, Lyra defeats Aldric and completes the ritual, becoming an eternal Guardian spirit who watches over the world from beyond.',
  status = 'published', 
  word_count = 750,
  purpose = 'Climactic resolution with noble sacrifice',
  hook = 'Ultimate sacrifice saves the world but changes everything',
  character_focus = 'Lyra - making the ultimate choice'
WHERE id = 'mQWd882TLR3RUIjiO4IDL';

-- ==========================================
-- 2. MIRRORS OF REALITY (Psychological Mystery)  
-- ==========================================

-- Update main story
UPDATE stories SET
  description = 'Dr. Elena Vasquez, a forensic psychiatrist, investigates a series of impossible murders where victims are found in locked rooms with no entry points. The only clue: each victim was last seen looking into an antique mirror. As Elena delves deeper, she discovers the killer can manipulate reality through reflections, trapping victims in mirror dimensions. But when Elena''s own reflection begins acting independently, she must question everything she knows about reality, sanity, and identity.',
  genre = 'Psychological Mystery',
  status = 'published',
  is_public = true,
  current_word_count = 2400
WHERE title = 'Mirrors of Reality';

COMMIT;
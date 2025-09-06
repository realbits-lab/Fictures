-- ==========================================
-- REMAINING PARTS + ALL CHAPTERS UPDATE
-- ==========================================

BEGIN;

-- ==========================================
-- ECHOES OF TOMORROW - Parts Update
-- ==========================================

UPDATE parts SET
  title = 'Part I: Temporal Fragments',
  description = 'Dr. Maya Cross''s rare Chronesthetic Syndrome allows her to hear temporal echoes—whispers of future events bleeding backward through time. Working for the Temporal Integrity Division, she investigates time travel incidents, but lately the echoes have been getting stronger and more disturbing. She hears fragments of a future where time has completely stopped, where every moment from the beginning to end of universe exists simultaneously in a frozen tableau. When she discovers that reckless time travelers have created so many paradoxes that the temporal structure itself is beginning to collapse, Maya realizes her condition isn''t a genetic anomaly—it''s the universe''s defense mechanism trying to stabilize reality.',
  current_word_count = 1350,
  target_word_count = 35000
WHERE id = 'BIwninD8pv6CQtYTOjfOJ';

UPDATE parts SET
  title = 'Part II: The Chronos Collective', 
  description = 'Maya''s investigation leads her to the Chronos Collective, a group of beings who exist outside linear time and have been trying to repair the temporal damage. They reveal that Maya is one of several "Temporal Anchors"—humans designed by the universe itself to stabilize reality when time streams begin to fracture. But other Anchors have gone rogue, using their abilities to create personal timeline empires where they rule over pocket realities as temporal gods. As Maya travels through collapsing time streams where past and future bleed together, she must confront corrupted versions of herself from erased timelines while learning to master abilities that could reshape the nature of causality itself.',
  current_word_count = 1400,
  target_word_count = 36000
WHERE id = 'XV9Ahx0tbhfxWpTU0qsqx';

UPDATE parts SET
  title = 'Part III: The Eternal Now',
  description = 'The temporal collapse reaches critical mass as all of history begins happening simultaneously—past, present, and future existing in a single moment of eternal now. Maya must make the ultimate choice: save linear time by anchoring herself as a permanent fixture in the timestream, or embrace the collapse and allow consciousness to experience all moments simultaneously. The decision will determine whether reality continues as a sequence of cause and effect, or transforms into something where every possibility exists in permanent coexistence. But as Maya prepares for the final temporal working, she discovers that the collapse isn''t an accident—it''s the universe''s natural evolution toward a state where time is no longer a constraint on existence.',
  current_word_count = 1300,
  target_word_count = 33000
WHERE id = 'x7GkGcOMDY7wP5tj4a3BL';

-- ==========================================
-- THE LAST GUARDIAN - Chapters Update
-- ==========================================

UPDATE chapters SET
  title = 'The Failing Light',
  summary = 'The ancient ward-stones protecting the village of Millbrook begin to crack and flicker, allowing shadow creatures to emerge from the void between worlds. Lyra Thornwick, a 23-year-old archival scholar researching historical anomalies, discovers that her unusual silver birthmark is actually a Guardian''s seal when it begins to glow in response to the dimensional incursions. Her grandmother''s spirit appears to her in a moment of crisis, revealing that Lyra is the last living descendant of the Luminous Guardians—an order that has protected reality from the Void Wraiths for millennia. As creatures of pure entropy attack the village, Lyra instinctively channels starlight through her seal, creating barriers of crystalline light that drive back the darkness.',
  status = 'published',
  word_count = 1100,
  target_word_count = 4000,
  purpose = 'Establish the world, introduce Lyra, and reveal her Guardian heritage through action',
  hook = 'Ancient protections fail just as the last Guardian awakens to her destiny',
  character_focus = 'Lyra Thornwick - from scholar to reluctant guardian'
WHERE id = 'mxsk2Vk6BWO-eqtfMOUyZ';

UPDATE chapters SET 
  title = 'Shadows of Betrayal',
  summary = 'Training under her grandmother''s spirit at the floating libraries of Skyhold, Lyra learns to channel starlight and manipulate crystalline barriers while studying the history of the Guardian order. Her progress is accelerated by Lord Commander Aldric Vane, a charismatic leader of the Celestial Council who claims to have been her grandmother''s closest ally. But when Lyra discovers coded messages hidden in ancient Guardian texts, she uncovers the truth: Vane orchestrated the massacre of her order twenty years ago, making a pact with the Void Wraiths to gain power over both the living and the spaces between dimensions. As Vane''s trap closes around her, Lyra must escape Skyhold while protecting the three Guardian artifacts in her possession.',
  status = 'published',
  word_count = 1200,
  target_word_count = 4200,
  purpose = 'Major plot twist revealing the mentor''s betrayal and raising the stakes',
  hook = 'The trusted mentor is revealed as the primary antagonist',
  character_focus = 'Lyra - dealing with betrayal and growing into her power'
WHERE id = '0di1cGRyljh60ufz44wtb';

UPDATE chapters SET
  title = 'The Eternal Seal',
  summary = 'In the climactic battle at the Sanctuary of Eternal Light, Lyra faces both Aldric Vane and the terrible truth about what it means to be a Guardian. The Seal of Binding—the ultimate Guardian technique—doesn''t just trap the Void Wraiths in a dimensional prison; it transforms the Guardian into a living constellation, forever watching over reality from the spaces between stars. As the boundaries between dimensions collapse and primordial darkness pours through reality''s cracks, Lyra gathers all seven Guardian artifacts and performs the ritual that will seal the Void Wraiths forever. In defeating Vane and completing the seal, she becomes something beyond mortal—an eternal guardian whose consciousness spans the cosmos, forever protecting a world that will never know she exists.',
  status = 'published',
  word_count = 900,
  target_word_count = 3800,
  purpose = 'Climactic resolution with noble sacrifice and transformation',
  hook = 'Ultimate sacrifice transforms the hero into something eternal',
  character_focus = 'Lyra - transcending humanity to become something greater'
WHERE id = 'mQWd882TLR3RUIjiO4IDL';

-- ==========================================
-- MIRRORS OF REALITY - Get Chapter IDs First
-- ==========================================

-- I need to get the chapter IDs for the remaining stories to update them
-- Let me continue with a systematic approach

COMMIT;
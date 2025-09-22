-- Add new status values for image generation phases
ALTER TYPE story_generation_status ADD VALUE IF NOT EXISTS 'phase5_6_complete';
ALTER TYPE story_generation_status ADD VALUE IF NOT EXISTS 'generating_character_images';
ALTER TYPE story_generation_status ADD VALUE IF NOT EXISTS 'character_images_complete';
ALTER TYPE story_generation_status ADD VALUE IF NOT EXISTS 'generating_setting_images';
ALTER TYPE story_generation_status ADD VALUE IF NOT EXISTS 'setting_images_complete';
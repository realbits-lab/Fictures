-- Add Adversity-Triumph Engine fields to existing tables
-- Migration: 0000_add_adversity_triumph_fields.sql

-- Stories table: Add moral framework and tone
ALTER TABLE "stories"
ADD COLUMN IF NOT EXISTS "tone" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "moral_framework" TEXT;

-- Update existing summary field to store thematic premise
COMMENT ON COLUMN "stories"."description" IS 'Deprecated: Use for migration. New stories use premise/theme fields';

-- Parts table: Add character arcs and nested cycle fields
ALTER TABLE "parts"
ADD COLUMN IF NOT EXISTS "act_number" INTEGER,
ADD COLUMN IF NOT EXISTS "character_arcs" JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN "parts"."character_arcs" IS 'Array of character macro arcs with progression planning';

-- Chapters table: Add nested cycle tracking
ALTER TABLE "chapters"
ADD COLUMN IF NOT EXISTS "character_id" TEXT REFERENCES "characters"("id"),
ADD COLUMN IF NOT EXISTS "arc_position" VARCHAR(20) CHECK ("arc_position" IN ('beginning', 'middle', 'climax', 'resolution')),
ADD COLUMN IF NOT EXISTS "contributes_to_macro_arc" TEXT,
ADD COLUMN IF NOT EXISTS "focus_characters" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "adversity_type" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "virtue_type" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "seeds_planted" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "seeds_resolved" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "connects_to_previous_chapter" TEXT,
ADD COLUMN IF NOT EXISTS "creates_next_adversity" TEXT;

-- Scenes table: Add cycle phase and emotional beat
ALTER TABLE "scenes"
ADD COLUMN IF NOT EXISTS "cycle_phase" VARCHAR(20) CHECK ("cycle_phase" IN ('setup', 'confrontation', 'virtue', 'consequence', 'transition')),
ADD COLUMN IF NOT EXISTS "emotional_beat" VARCHAR(50);

-- Characters table: Add Adversity-Triumph core fields
ALTER TABLE "characters"
ADD COLUMN IF NOT EXISTS "is_main" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "core_trait" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "internal_flaw" TEXT,
ADD COLUMN IF NOT EXISTS "external_goal" TEXT,
ADD COLUMN IF NOT EXISTS "personality" JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "backstory" TEXT,
ADD COLUMN IF NOT EXISTS "relationships" JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "physical_description" JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "voice_style" JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "visual_style" VARCHAR(50);

COMMENT ON COLUMN "characters"."core_trait" IS 'THE defining moral virtue: courage, compassion, integrity, loyalty, wisdom, sacrifice';
COMMENT ON COLUMN "characters"."internal_flaw" IS 'MUST include cause: [fears/believes/wounded by] X because Y';
COMMENT ON COLUMN "characters"."relationships" IS 'Jeong system: tracks deep affective bonds between characters';

-- Settings table: Add adversity elements and cycle amplification
ALTER TABLE "settings"
ADD COLUMN IF NOT EXISTS "adversity_elements" JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "symbolic_meaning" TEXT,
ADD COLUMN IF NOT EXISTS "cycle_amplification" JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "mood" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "emotional_resonance" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "sensory" JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "architectural_style" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "visual_style" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "visual_references" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "color_palette" JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN "settings"."adversity_elements" IS 'External conflict sources: physicalObstacles, scarcityFactors, dangerSources, socialDynamics';
COMMENT ON COLUMN "settings"."cycle_amplification" IS 'How setting amplifies each cycle phase: setup, confrontation, virtue, consequence, transition';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_chapters_character_id" ON "chapters"("character_id");
CREATE INDEX IF NOT EXISTS "idx_chapters_arc_position" ON "chapters"("arc_position");
CREATE INDEX IF NOT EXISTS "idx_scenes_cycle_phase" ON "scenes"("cycle_phase");
CREATE INDEX IF NOT EXISTS "idx_characters_is_main" ON "characters"("is_main");

-- Step 1: Update NULL values with default values before setting NOT NULL constraints
UPDATE "characters" SET "is_main" = false WHERE "is_main" IS NULL;--> statement-breakpoint
UPDATE "characters" SET "summary" = 'Character summary pending' WHERE "summary" IS NULL;--> statement-breakpoint
UPDATE "characters" SET "core_trait" = 'courage' WHERE "core_trait" IS NULL;--> statement-breakpoint
UPDATE "characters" SET "internal_flaw" = 'Internal flaw pending' WHERE "internal_flaw" IS NULL;--> statement-breakpoint
UPDATE "characters" SET "external_goal" = 'External goal pending' WHERE "external_goal" IS NULL;--> statement-breakpoint
UPDATE "characters" SET "personality" = '{"traits": [], "values": []}'::jsonb WHERE "personality" IS NULL;--> statement-breakpoint
UPDATE "characters" SET "backstory" = 'Backstory pending' WHERE "backstory" IS NULL;--> statement-breakpoint
UPDATE "characters" SET "physical_description" = '{"age": "unknown", "appearance": "unknown", "distinctiveFeatures": "unknown", "style": "unknown"}'::jsonb WHERE "physical_description" IS NULL;--> statement-breakpoint
UPDATE "characters" SET "voice_style" = '{"tone": "neutral", "vocabulary": "standard", "quirks": [], "emotionalRange": "balanced"}'::jsonb WHERE "voice_style" IS NULL;--> statement-breakpoint

-- Step 2: Apply NOT NULL constraints
ALTER TABLE "characters" ALTER COLUMN "is_main" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "summary" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "core_trait" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "internal_flaw" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "external_goal" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "personality" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "backstory" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "physical_description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "voice_style" SET NOT NULL;--> statement-breakpoint

-- Step 3: Drop visual_style column
ALTER TABLE "characters" DROP COLUMN IF EXISTS "visual_style";
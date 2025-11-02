-- Add setting_id column to scenes table for explicit scene-to-setting connection
-- This enables scene-level setting tracking for the Adversity-Triumph Engine

ALTER TABLE "scenes" ADD COLUMN "setting_id" text;

-- Add foreign key constraint
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_setting_id_settings_id_fk" FOREIGN KEY ("setting_id") REFERENCES "settings"("id") ON DELETE no action ON UPDATE no action;

-- Add index for query performance
CREATE INDEX IF NOT EXISTS "idx_scenes_setting_id" ON "scenes" ("setting_id");

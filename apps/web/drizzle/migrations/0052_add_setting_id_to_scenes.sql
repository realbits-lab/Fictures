-- Add setting_id column to scenes table
ALTER TABLE "scenes" ADD COLUMN "setting_id" text;

-- Add index for setting_id lookups
CREATE INDEX IF NOT EXISTS "idx_scenes_setting_id" ON "scenes" USING btree ("setting_id");

-- Add foreign key constraint
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_setting_id_settings_id_fk" FOREIGN KEY ("setting_id") REFERENCES "settings"("id") ON DELETE set null ON UPDATE no action;

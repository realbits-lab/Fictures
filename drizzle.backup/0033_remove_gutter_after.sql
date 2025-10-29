-- Remove gutter_after column from comic_panels table
ALTER TABLE "comic_panels" DROP COLUMN IF EXISTS "gutter_after";

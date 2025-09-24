-- Remove cover_image field from stories table
-- Story images will be stored in hnsData.storyImage instead

ALTER TABLE "stories" DROP COLUMN IF EXISTS "cover_image";
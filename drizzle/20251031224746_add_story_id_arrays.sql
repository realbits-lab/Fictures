-- Add ID array columns to stories table for quick access to related entities
ALTER TABLE "stories" ADD COLUMN "part_ids" json DEFAULT '[]'::json;
ALTER TABLE "stories" ADD COLUMN "chapter_ids" json DEFAULT '[]'::json;
ALTER TABLE "stories" ADD COLUMN "scene_ids" json DEFAULT '[]'::json;

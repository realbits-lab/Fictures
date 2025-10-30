-- Add image optimization fields to support responsive images
-- Adds imageUrl and imageVariants fields to stories, scenes, characters, places, and settings tables

-- Add imageUrl and imageVariants to stories table
ALTER TABLE "stories" ADD COLUMN "image_url" text;
ALTER TABLE "stories" ADD COLUMN "image_variants" json;

-- Add imageUrl and imageVariants to scenes table
ALTER TABLE "scenes" ADD COLUMN "image_url" text;
ALTER TABLE "scenes" ADD COLUMN "image_variants" json;

-- Add imageVariants to characters table (imageUrl already exists)
ALTER TABLE "characters" ADD COLUMN "image_variants" json;

-- Add imageVariants to places table (imageUrl already exists)
ALTER TABLE "places" ADD COLUMN "image_variants" json;

-- Add imageVariants to settings table (imageUrl already exists)
ALTER TABLE "settings" ADD COLUMN "image_variants" json;

-- Custom SQL migration file, put your code below! --

-- Add image URL fields to characters and places tables for storing Vercel Blob URLs
ALTER TABLE "characters" ADD COLUMN "image_url" text;
ALTER TABLE "places" ADD COLUMN "image_url" text;
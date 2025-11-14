-- Add comic_toonplay JSONB field to scenes table
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS comic_toonplay JSONB;

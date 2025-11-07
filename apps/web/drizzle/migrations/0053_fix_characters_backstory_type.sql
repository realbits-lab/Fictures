-- Fix characters backstory field type from json to text
ALTER TABLE "characters" ALTER COLUMN "backstory" TYPE text USING backstory::text;

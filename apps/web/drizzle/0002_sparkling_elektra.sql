-- Step 1: Create the new genre enum type
CREATE TYPE "public"."genre" AS ENUM('Fantasy', 'Romance', 'SciFi', 'Mystery', 'Horror', 'Action', 'Isekai', 'LitRPG', 'Cultivation', 'Slice', 'Paranormal', 'Dystopian', 'Historical', 'LGBTQ');--> statement-breakpoint

-- Step 2: Update existing genre values to match new enum (map old values to new)
UPDATE "stories" SET "genre" = 'SciFi' WHERE "genre" LIKE '%Science Fiction%' OR "genre" = 'Science Fiction';--> statement-breakpoint
UPDATE "stories" SET "genre" = 'SciFi' WHERE "genre" LIKE '%Cyberpunk%';--> statement-breakpoint
UPDATE "stories" SET "genre" = 'Action' WHERE "genre" IN ('Thriller', 'Detective', 'Adventure');--> statement-breakpoint
UPDATE "stories" SET "genre" = 'Slice' WHERE "genre" IN ('Contemporary', 'Contemporary Fiction');--> statement-breakpoint
UPDATE "stories" SET "genre" = 'Historical' WHERE "genre" IN ('Historical Fiction');--> statement-breakpoint
UPDATE "stories" SET "genre" = 'Slice' WHERE "genre" NOT IN ('Fantasy', 'Romance', 'SciFi', 'Mystery', 'Horror', 'Action', 'Isekai', 'LitRPG', 'Cultivation', 'Slice', 'Paranormal', 'Dystopian', 'Historical', 'LGBTQ');--> statement-breakpoint

-- Step 3: Convert the column to use the new enum type
ALTER TABLE "stories" ALTER COLUMN "genre" SET DATA TYPE "public"."genre" USING "genre"::"public"."genre";
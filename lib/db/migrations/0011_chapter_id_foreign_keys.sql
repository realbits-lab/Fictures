-- Migration: Update bookmark and reading progress tables to use chapterId foreign keys instead of chapterNumber
-- This improves referential integrity and query performance

-- 1. Add new chapterId columns
ALTER TABLE "Bookmark" ADD COLUMN "chapterId" uuid;
ALTER TABLE "ReadingProgress" ADD COLUMN "currentChapterId" uuid;

-- 2. Populate new columns with existing data
-- For Bookmark table: find chapter ID based on storyId and chapterNumber
UPDATE "Bookmark" 
SET "chapterId" = (
  SELECT c."id" 
  FROM "Chapter" c 
  WHERE c."storyId" = "Bookmark"."storyId" 
    AND c."chapterNumber" = "Bookmark"."chapterNumber"
);

-- For ReadingProgress table: find chapter ID based on storyId and currentChapterNumber
UPDATE "ReadingProgress" 
SET "currentChapterId" = (
  SELECT c."id" 
  FROM "Chapter" c 
  WHERE c."storyId" = "ReadingProgress"."storyId" 
    AND c."chapterNumber" = "ReadingProgress"."currentChapterNumber"
);

-- 3. Add foreign key constraints to new columns
DO $$ BEGIN
 ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_chapterId_Chapter_id_fk" 
   FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_currentChapterId_Chapter_id_fk" 
   FOREIGN KEY ("currentChapterId") REFERENCES "public"."Chapter"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- 4. Make the new columns NOT NULL for Bookmark table (but keep ReadingProgress nullable for flexibility)
ALTER TABLE "Bookmark" ALTER COLUMN "chapterId" SET NOT NULL;

-- 5. Drop old columns (after ensuring data migration is complete)
ALTER TABLE "Bookmark" DROP COLUMN "chapterNumber";
ALTER TABLE "ReadingProgress" DROP COLUMN "currentChapterNumber";
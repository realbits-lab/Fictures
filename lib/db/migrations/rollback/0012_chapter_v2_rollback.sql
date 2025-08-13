BEGIN;

-- Remove indexes
DROP INDEX IF EXISTS "idx_chapter_chatid";
DROP INDEX IF EXISTS "idx_chapter_generation_chapterid";
DROP INDEX IF EXISTS "idx_chapter_generation_status";
DROP INDEX IF EXISTS "idx_chapter_generation_created";

-- Drop new table
DROP TABLE IF EXISTS "ChapterGeneration";

-- Remove columns from Chapter
ALTER TABLE "Chapter" 
DROP COLUMN IF EXISTS "chatId",
DROP COLUMN IF EXISTS "generationPrompt",
DROP COLUMN IF EXISTS "previousChapterSummary";

-- Remove chat type
ALTER TABLE "Chat" 
DROP COLUMN IF EXISTS "chatType";

COMMIT;
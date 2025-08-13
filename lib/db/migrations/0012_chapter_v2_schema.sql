BEGIN;

-- Add chapter-chat relationship columns to Chapter table
ALTER TABLE "Chapter" 
ADD COLUMN IF NOT EXISTS "chatId" UUID REFERENCES "Chat"("id"),
ADD COLUMN IF NOT EXISTS "generationPrompt" TEXT,
ADD COLUMN IF NOT EXISTS "previousChapterSummary" TEXT;

-- Create chapter generation history table
CREATE TABLE IF NOT EXISTS "ChapterGeneration" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "chapterId" UUID REFERENCES "Chapter"("id") ON DELETE CASCADE NOT NULL,
  "prompt" TEXT NOT NULL,
  "generatedContent" TEXT,
  "status" VARCHAR(20) DEFAULT 'pending' CHECK ("status" IN ('pending', 'generating', 'completed', 'failed')),
  "error" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "completedAt" TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_chapter_chatid" ON "Chapter"("chatId");
CREATE INDEX IF NOT EXISTS "idx_chapter_generation_chapterid" ON "ChapterGeneration"("chapterId");
CREATE INDEX IF NOT EXISTS "idx_chapter_generation_status" ON "ChapterGeneration"("status");
CREATE INDEX IF NOT EXISTS "idx_chapter_generation_created" ON "ChapterGeneration"("createdAt" DESC);

-- Add chat type for better organization
ALTER TABLE "Chat" 
ADD COLUMN IF NOT EXISTS "chatType" VARCHAR(20) DEFAULT 'general' CHECK ("chatType" IN ('general', 'chapter', 'story'));

-- Update existing chats linked to chapters
UPDATE "Chat" 
SET "chatType" = 'chapter' 
WHERE "id" IN (SELECT DISTINCT "chatId" FROM "Chapter" WHERE "chatId" IS NOT NULL);

COMMIT;
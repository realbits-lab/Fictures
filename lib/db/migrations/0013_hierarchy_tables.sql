-- Migration: Add Book Hierarchy Tables
-- 4-level organization: Story > Part > Chapter > Scene

-- Create Story table (Top Level)
CREATE TABLE "Story" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "bookId" uuid NOT NULL,
  "title" text NOT NULL,
  "synopsis" text,
  "themes" json NOT NULL DEFAULT '[]',
  "worldSettings" json,
  "characterArcs" json,
  "plotStructure" json,
  "order" integer NOT NULL DEFAULT 0,
  "wordCount" integer NOT NULL DEFAULT 0,
  "partCount" integer NOT NULL DEFAULT 0,
  "isActive" boolean NOT NULL DEFAULT true,
  "metadata" json,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Create Part table (Second Level)
CREATE TABLE "Part" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "storyId" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "partNumber" integer NOT NULL,
  "thematicFocus" text,
  "timeframe" json,
  "location" text,
  "wordCount" integer NOT NULL DEFAULT 0,
  "chapterCount" integer NOT NULL DEFAULT 0,
  "order" integer NOT NULL DEFAULT 0,
  "isComplete" boolean NOT NULL DEFAULT false,
  "notes" text,
  "metadata" json,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Create ChapterEnhanced table (Third Level)
CREATE TABLE "ChapterEnhanced" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "partId" uuid NOT NULL,
  "bookId" uuid NOT NULL,
  "chapterNumber" integer NOT NULL,
  "globalChapterNumber" integer NOT NULL,
  "title" text NOT NULL,
  "summary" text,
  "content" json NOT NULL,
  "wordCount" integer NOT NULL DEFAULT 0,
  "sceneCount" integer NOT NULL DEFAULT 0,
  "order" integer NOT NULL DEFAULT 0,
  "pov" text,
  "timeline" json,
  "setting" text,
  "charactersPresent" json NOT NULL DEFAULT '[]',
  "isPublished" boolean NOT NULL DEFAULT false,
  "publishedAt" timestamp,
  "chatId" uuid,
  "generationPrompt" text,
  "previousChapterSummary" text,
  "nextChapterHints" text,
  "authorNote" text,
  "metadata" json,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Create Scene table (Atomic Level)
CREATE TABLE "Scene" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "chapterId" uuid NOT NULL,
  "sceneNumber" integer NOT NULL,
  "title" text,
  "content" text NOT NULL,
  "wordCount" integer NOT NULL DEFAULT 0,
  "order" integer NOT NULL DEFAULT 0,
  "sceneType" varchar NOT NULL DEFAULT 'action',
  "pov" text,
  "location" text,
  "timeOfDay" text,
  "charactersPresent" json NOT NULL DEFAULT '[]',
  "mood" varchar NOT NULL DEFAULT 'neutral',
  "purpose" text,
  "conflict" text,
  "resolution" text,
  "hooks" json,
  "beats" json,
  "isComplete" boolean NOT NULL DEFAULT false,
  "generationPrompt" text,
  "aiContext" json,
  "notes" text,
  "metadata" json,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Create BookHierarchyPath table (Navigation Helper)
CREATE TABLE "BookHierarchyPath" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "bookId" uuid NOT NULL,
  "storyId" uuid,
  "partId" uuid,
  "chapterId" uuid,
  "sceneId" uuid,
  "level" varchar NOT NULL,
  "path" text NOT NULL,
  "breadcrumb" json,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

-- Create ContentSearchIndex table (Search)
CREATE TABLE "ContentSearchIndex" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "bookId" uuid NOT NULL,
  "entityType" varchar NOT NULL,
  "entityId" uuid NOT NULL,
  "searchableText" text NOT NULL,
  "title" text NOT NULL,
  "path" text NOT NULL,
  "metadata" json,
  "tsvector" text,
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE "Story" ADD CONSTRAINT "Story_bookId_Book_id_fk" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "Part" ADD CONSTRAINT "Part_storyId_Story_id_fk" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ChapterEnhanced" ADD CONSTRAINT "ChapterEnhanced_partId_Part_id_fk" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ChapterEnhanced" ADD CONSTRAINT "ChapterEnhanced_bookId_Book_id_fk" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "ChapterEnhanced" ADD CONSTRAINT "ChapterEnhanced_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_chapterId_ChapterEnhanced_id_fk" FOREIGN KEY ("chapterId") REFERENCES "ChapterEnhanced"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "BookHierarchyPath" ADD CONSTRAINT "BookHierarchyPath_bookId_Book_id_fk" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "BookHierarchyPath" ADD CONSTRAINT "BookHierarchyPath_storyId_Story_id_fk" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "BookHierarchyPath" ADD CONSTRAINT "BookHierarchyPath_partId_Part_id_fk" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "BookHierarchyPath" ADD CONSTRAINT "BookHierarchyPath_chapterId_ChapterEnhanced_id_fk" FOREIGN KEY ("chapterId") REFERENCES "ChapterEnhanced"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "BookHierarchyPath" ADD CONSTRAINT "BookHierarchyPath_sceneId_Scene_id_fk" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "ContentSearchIndex" ADD CONSTRAINT "ContentSearchIndex_bookId_Book_id_fk" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE cascade ON UPDATE no action;

-- Add check constraints for enums
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_sceneType_check" CHECK ("sceneType" IN ('action', 'dialogue', 'exposition', 'transition', 'climax'));
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_mood_check" CHECK ("mood" IN ('tense', 'romantic', 'mysterious', 'comedic', 'dramatic', 'neutral'));
ALTER TABLE "BookHierarchyPath" ADD CONSTRAINT "BookHierarchyPath_level_check" CHECK ("level" IN ('book', 'story', 'part', 'chapter', 'scene'));
ALTER TABLE "ContentSearchIndex" ADD CONSTRAINT "ContentSearchIndex_entityType_check" CHECK ("entityType" IN ('story', 'part', 'chapter', 'scene'));

-- Performance indexes
CREATE INDEX "idx_story_book_id" ON "Story"("bookId");
CREATE INDEX "idx_part_story_id" ON "Part"("storyId");
CREATE INDEX "idx_chapter_part_id" ON "ChapterEnhanced"("partId");
CREATE INDEX "idx_scene_chapter_id" ON "Scene"("chapterId");

-- Order indexes for sorting
CREATE INDEX "idx_story_order" ON "Story"("bookId", "order");
CREATE INDEX "idx_part_order" ON "Part"("storyId", "order");
CREATE INDEX "idx_chapter_order" ON "ChapterEnhanced"("partId", "order");
CREATE INDEX "idx_scene_order" ON "Scene"("chapterId", "order");

-- Search indexes
CREATE INDEX "idx_search_book_entity" ON "ContentSearchIndex"("bookId", "entityType");
CREATE INDEX "idx_search_text" ON "ContentSearchIndex" USING gin(to_tsvector('english', "searchableText"));

-- Navigation path index
CREATE INDEX "idx_hierarchy_path_book" ON "BookHierarchyPath"("bookId", "level");

-- Unique constraints for business rules
CREATE UNIQUE INDEX "uniq_story_book_order" ON "Story"("bookId", "order");
CREATE UNIQUE INDEX "uniq_part_story_number" ON "Part"("storyId", "partNumber");
CREATE UNIQUE INDEX "uniq_chapter_part_number" ON "ChapterEnhanced"("partId", "chapterNumber");
CREATE UNIQUE INDEX "uniq_scene_chapter_number" ON "Scene"("chapterId", "sceneNumber");
-- Custom SQL migration file, put your code below! --

-- Add missing columns to stories table
ALTER TABLE "stories" ADD COLUMN "content" text DEFAULT '';
ALTER TABLE "stories" ADD COLUMN "part_ids" json DEFAULT '[]'::json NOT NULL;
ALTER TABLE "stories" ADD COLUMN "chapter_ids" json DEFAULT '[]'::json NOT NULL;

-- Add missing columns to parts table
ALTER TABLE "parts" ADD COLUMN "author_id" text NOT NULL;
ALTER TABLE "parts" ADD COLUMN "target_word_count" integer DEFAULT 0;
ALTER TABLE "parts" ADD COLUMN "current_word_count" integer DEFAULT 0;
ALTER TABLE "parts" ADD COLUMN "status" varchar(50) DEFAULT 'planned';
ALTER TABLE "parts" ADD COLUMN "content" text DEFAULT '';
ALTER TABLE "parts" ADD COLUMN "chapter_ids" json DEFAULT '[]'::json NOT NULL;

-- Add missing columns to chapters table
ALTER TABLE "chapters" ADD COLUMN "author_id" text NOT NULL;
ALTER TABLE "chapters" ADD COLUMN "purpose" text;
ALTER TABLE "chapters" ADD COLUMN "hook" text;
ALTER TABLE "chapters" ADD COLUMN "character_focus" text;
ALTER TABLE "chapters" ADD COLUMN "scene_ids" json DEFAULT '[]'::json NOT NULL;

-- Add missing columns to scenes table
ALTER TABLE "scenes" ADD COLUMN "character_ids" json DEFAULT '[]'::json NOT NULL;
ALTER TABLE "scenes" ADD COLUMN "place_ids" json DEFAULT '[]'::json NOT NULL;

-- Add foreign key constraints for author_id columns
ALTER TABLE "parts" ADD CONSTRAINT "parts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

-- Add missing characters table columns for YAML content storage
ALTER TABLE "characters" ADD COLUMN "content" text DEFAULT '';

-- Update existing data to set author_id for parts and chapters based on their story's author
UPDATE "parts" SET "author_id" = (
  SELECT "author_id" FROM "stories" WHERE "stories"."id" = "parts"."story_id"
);

UPDATE "chapters" SET "author_id" = (
  SELECT "author_id" FROM "stories" WHERE "stories"."id" = "chapters"."story_id"
);
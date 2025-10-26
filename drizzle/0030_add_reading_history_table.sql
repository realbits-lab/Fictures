-- Create reading_history table
CREATE TABLE IF NOT EXISTS "reading_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"story_id" text NOT NULL,
	"last_read_at" timestamp DEFAULT now() NOT NULL,
	"read_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_story_unique" UNIQUE("user_id","story_id")
);

-- Add foreign key constraints
DO $$
BEGIN
	ALTER TABLE "reading_history" ADD CONSTRAINT "reading_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
	ALTER TABLE "reading_history" ADD CONSTRAINT "reading_history_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "reading_history_user_id_idx" ON "reading_history"("user_id");
CREATE INDEX IF NOT EXISTS "reading_history_story_id_idx" ON "reading_history"("story_id");
CREATE INDEX IF NOT EXISTS "reading_history_last_read_at_idx" ON "reading_history"("last_read_at" DESC);

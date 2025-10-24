ALTER TABLE "chapters" ADD COLUMN "author_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "purpose" text;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "hook" text;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "character_focus" text;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "author_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "target_word_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "current_word_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "status" varchar(50) DEFAULT 'planned';--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "part_data" json;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "story_data" json;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
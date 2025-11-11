CREATE TYPE "public"."character_arc_position" AS ENUM('primary', 'secondary');--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "summary" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "genre" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "tone" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "moral_framework" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "view_count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "rating" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "rating_count" SET NOT NULL;
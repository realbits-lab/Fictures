CREATE TYPE "public"."core_trait" AS ENUM('courage', 'compassion', 'integrity', 'loyalty', 'wisdom', 'sacrifice');--> statement-breakpoint
ALTER TABLE "chapters" ALTER COLUMN "virtue_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."virtue_type";--> statement-breakpoint
CREATE TYPE "public"."virtue_type" AS ENUM('courage', 'compassion', 'integrity', 'loyalty', 'wisdom', 'sacrifice');--> statement-breakpoint
ALTER TABLE "chapters" ALTER COLUMN "virtue_type" SET DATA TYPE "public"."virtue_type" USING "virtue_type"::"public"."virtue_type";--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "core_trait" SET DATA TYPE "public"."core_trait" USING "core_trait"::"public"."core_trait";
CREATE TYPE "public"."adversity_type" AS ENUM('internal', 'external', 'both');--> statement-breakpoint
CREATE TYPE "public"."arc_position" AS ENUM('beginning', 'middle', 'climax', 'resolution');--> statement-breakpoint
CREATE TYPE "public"."cycle_phase" AS ENUM('setup', 'confrontation', 'virtue', 'consequence', 'transition');--> statement-breakpoint
CREATE TYPE "public"."emotional_beat" AS ENUM('fear', 'hope', 'tension', 'relief', 'elevation', 'catharsis', 'despair', 'joy');--> statement-breakpoint
CREATE TYPE "public"."tone" AS ENUM('hopeful', 'dark', 'bittersweet', 'satirical');--> statement-breakpoint
CREATE TYPE "public"."virtue_type" AS ENUM('courage', 'compassion', 'integrity', 'sacrifice', 'loyalty', 'wisdom');--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "characterId" text;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "arcPosition" "arc_position";--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "contributesToMacroArc" text;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "focusCharacters" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "adversityType" "adversity_type";--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "virtueType" "virtue_type";--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "seedsPlanted" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "seedsResolved" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "connectsToPreviousChapter" text;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "createsNextAdversity" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "coreTrait" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "internalFlaw" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "externalGoal" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "relationships" json;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "voiceStyle" json;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "visualStyle" text;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "actNumber" integer;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "characterArcs" json;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "cyclePhase" "cycle_phase";--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "emotionalBeat" "emotional_beat";--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "adversityElements" json;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "symbolicMeaning" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "cycleAmplification" json;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "emotionalResonance" text;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "tone" "tone";--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "moralFramework" text;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_characterId_characters_id_fk" FOREIGN KEY ("characterId") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
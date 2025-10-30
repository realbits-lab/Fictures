-- Create scene_evaluations table for storing AI-powered scene evaluations
-- Based on the Architectonics of Engagement framework

CREATE TABLE IF NOT EXISTS "scene_evaluations" (
  "id" text PRIMARY KEY NOT NULL,
  "scene_id" text NOT NULL REFERENCES "scenes"("id") ON DELETE CASCADE,
  "evaluation" json NOT NULL,
  "overall_score" varchar(10) NOT NULL,
  "plot_score" varchar(10) NOT NULL,
  "character_score" varchar(10) NOT NULL,
  "pacing_score" varchar(10) NOT NULL,
  "prose_score" varchar(10) NOT NULL,
  "world_building_score" varchar(10) NOT NULL,
  "model_version" varchar(50) DEFAULT 'gpt-4o-mini',
  "token_usage" integer,
  "evaluation_time_ms" integer,
  "evaluated_at" timestamp DEFAULT now() NOT NULL
);

-- Create index on scene_id for faster lookups
CREATE INDEX IF NOT EXISTS "scene_evaluations_scene_id_idx" ON "scene_evaluations"("scene_id");

-- Create index on evaluated_at for time-based queries
CREATE INDEX IF NOT EXISTS "scene_evaluations_evaluated_at_idx" ON "scene_evaluations"("evaluated_at");

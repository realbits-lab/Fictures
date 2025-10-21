#!/usr/bin/env node

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '..', '.env.local') });

const sql = `
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

CREATE INDEX IF NOT EXISTS "scene_evaluations_scene_id_idx" ON "scene_evaluations"("scene_id");
CREATE INDEX IF NOT EXISTS "scene_evaluations_evaluated_at_idx" ON "scene_evaluations"("evaluated_at");
`;

async function main() {
  const client = new Client({ connectionString: process.env.POSTGRES_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    await client.query(sql);
    console.log('✅ Table scene_evaluations created successfully');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

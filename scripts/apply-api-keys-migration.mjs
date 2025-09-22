#!/usr/bin/env node

import { config } from 'dotenv';
import postgres from 'postgres';

// Load environment variables
config({ path: '.env.local' });

const client = postgres(process.env.POSTGRES_URL, { prepare: false });

async function applyMigration() {
  try {
    console.log('Applying API keys table migration...');

    await client`
      CREATE TABLE IF NOT EXISTS "api_keys" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "name" varchar(255) DEFAULT 'API Key' NOT NULL,
        "key_hash" varchar(64) NOT NULL,
        "key_prefix" varchar(16) NOT NULL,
        "scopes" json DEFAULT '[]'::json NOT NULL,
        "last_used_at" timestamp,
        "expires_at" timestamp,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
      )
    `;

    console.log('✅ Created api_keys table');

    // Add foreign key constraint
    await client`
      DO $$ BEGIN
        ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$
    `;

    console.log('✅ Added foreign key constraint');

    // Create indexes
    await client`
      CREATE INDEX IF NOT EXISTS "idx_api_keys_user_id" ON "api_keys" USING btree ("user_id")
    `;

    await client`
      CREATE INDEX IF NOT EXISTS "idx_api_keys_hash" ON "api_keys" USING btree ("key_hash")
    `;

    console.log('✅ Created indexes');
    console.log('\n✅ Migration applied successfully!');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    await client.end();
    process.exit(1);
  }
}

applyMigration();
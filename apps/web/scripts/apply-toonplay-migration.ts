#!/usr/bin/env tsx

/**
 * Apply comic_toonplay field migration
 *
 * Adds the comic_toonplay JSONB column to scenes table
 */

import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

async function applyMigration() {
    console.log("🔄 Applying comic_toonplay migration...");

    const databaseUrl = process.env.DATABASE_URL_UNPOOLED;
    if (!databaseUrl) {
        console.error("❌ DATABASE_URL_UNPOOLED not found in environment");
        process.exit(1);
    }

    const client = neon(databaseUrl);
    const db = drizzle(client);

    try {
        // Add comic_toonplay column to scenes table
        await db.execute(sql`
            ALTER TABLE scenes
            ADD COLUMN IF NOT EXISTS comic_toonplay JSONB
        `);

        console.log("✅ Migration applied successfully");
        console.log("   - Added comic_toonplay JSONB column to scenes table");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

applyMigration();

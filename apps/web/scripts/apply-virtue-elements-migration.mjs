#!/usr/bin/env node
/**
 * Apply virtue_elements migration manually
 * This script applies the migration to rename/create virtue_elements column
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const DATABASE_URL =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error(
        "❌ DATABASE_URL or DATABASE_URL_UNPOOLED environment variable not set",
    );
    process.exit(1);
}

async function applyMigration() {
    const sql = postgres(DATABASE_URL, { max: 1 });

    try {
        console.log("🔄 Applying virtue_elements migration...");

        // Read migration file
        const migrationPath = join(
            process.cwd(),
            "drizzle/migrations/rename_cycle_amplification_to_virtue_elements.sql",
        );
        const migrationSQL = readFileSync(migrationPath, "utf-8");

        console.log("📄 Migration SQL loaded");

        // Execute migration
        await sql.unsafe(migrationSQL);

        console.log("✅ Migration applied successfully!");

        // Verify the column exists
        const result = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'settings'
      AND column_name = 'virtue_elements'
    `;

        if (result.length > 0) {
            console.log("✅ Verified: virtue_elements column exists");
            console.log(`   Type: ${result[0].data_type}`);
        } else {
            console.log(
                "⚠️  Warning: virtue_elements column not found after migration",
            );
        }
    } catch (error) {
        console.error("❌ Migration failed:", error.message);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

applyMigration();

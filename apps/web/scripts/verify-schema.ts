/**
 * Verify Database Schema
 * Check column nullability in database
 */

import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function verifySchema(): Promise<void> {
    console.log("🔍 Verifying database schema...\n");

    try {
        // Check settings table
        const settingsColumns = await db.execute(sql`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'settings'
        AND column_name IN ('summary', 'adversity_elements', 'mood', 'sensory', 'image_url', 'image_variants', 'symbolic_meaning', 'emotional_resonance')
      ORDER BY column_name;
    `);

        console.log("📋 Settings table columns:");
        for (const row of settingsColumns.rows) {
            const nullable = row.is_nullable === "YES" ? "✅ NULL" : "❌ NOT NULL";
            console.log(
                `  ${row.column_name.padEnd(25)} ${nullable.padEnd(12)} (${row.data_type})`,
            );
        }

        // Check chapters table
        const chaptersColumns = await db.execute(sql`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'chapters'
        AND column_name IN ('summary', 'character_id', 'arc_position', 'adversity_type', 'virtue_type', 'published_at', 'scheduled_for')
      ORDER BY column_name;
    `);

        console.log("\n📋 Chapters table columns:");
        for (const row of chaptersColumns.rows) {
            const nullable = row.is_nullable === "YES" ? "✅ NULL" : "❌ NOT NULL";
            console.log(
                `  ${row.column_name.padEnd(25)} ${nullable.padEnd(12)} (${row.data_type})`,
            );
        }

        console.log("\n✅ Schema verification complete!");
    } catch (error) {
        console.error("\n❌ Verification failed:", error);
        throw error;
    }
}

verifySchema();

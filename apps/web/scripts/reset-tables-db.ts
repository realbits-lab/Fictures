/**
 * Reset All Story Tables - Direct Database Approach
 */

import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import {
    chapters,
    characters,
    parts,
    scenes,
    settings,
    stories,
} from "../src/lib/schemas/database";

async function resetTables(): Promise<void> {
    console.log("🔄 Resetting all story tables...\n");

    try {
        // Delete in order to respect foreign key constraints
        console.log("📝 Deleting scenes...");
        await db.delete(scenes);
        console.log("✅ Scenes deleted");

        console.log("\n📝 Deleting chapters...");
        await db.delete(chapters);
        console.log("✅ Chapters deleted");

        console.log("\n📝 Deleting parts...");
        await db.delete(parts);
        console.log("✅ Parts deleted");

        console.log("\n📝 Deleting characters...");
        await db.delete(characters);
        console.log("✅ Characters deleted");

        console.log("\n📝 Deleting settings...");
        await db.delete(settings);
        console.log("✅ Settings deleted");

        console.log("\n📝 Deleting stories...");
        await db.delete(stories);
        console.log("✅ Stories deleted");

        console.log("\n✅ All tables reset successfully!");
    } catch (error) {
        console.error("\n❌ Reset failed:", error);
        throw error;
    }
}

resetTables();

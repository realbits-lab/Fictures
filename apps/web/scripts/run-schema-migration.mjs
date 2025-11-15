#!/usr/bin/env node

/**
 * Run schema migration to remove redundant author fields and research table
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
    console.error(
        "❌ ERROR: DATABASE_URL_UNPOOLED environment variable is not set",
    );
    process.exit(1);
}

const client = postgres(connectionString, { max: 1 });
const _db = drizzle(client);

console.log("🔄 Running database schema migrations...\n");

try {
    // Drop research table
    console.log("1. Dropping research table...");
    await client`DROP TABLE IF EXISTS "research" CASCADE`;
    console.log("   ✅ Research table dropped\n");

    // Remove author_id from chapters
    console.log("2. Removing author_id from chapters table...");
    await client`ALTER TABLE "chapters" DROP COLUMN IF EXISTS "author_id"`;
    console.log("   ✅ chapters.author_id removed\n");

    // Remove author_id from parts
    console.log("3. Removing author_id from parts table...");
    await client`ALTER TABLE "parts" DROP COLUMN IF EXISTS "author_id"`;
    console.log("   ✅ parts.author_id removed\n");

    console.log("✅ All migrations completed successfully!");
    console.log("\n📋 Summary:");
    console.log("   - Dropped: research table");
    console.log("   - Removed: chapters.author_id");
    console.log("   - Removed: parts.author_id");
    console.log(
        "\n💡 Author information is now accessed via JOIN with stories table",
    );
} catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("\nError details:", error);
    process.exit(1);
} finally {
    await client.end();
    process.exit(0);
}

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) {
    throw new Error("DATABASE_URL_UNPOOLED is not set");
}

const client = postgres(connectionString);
const db = drizzle(client);

async function markMigrationAsApplied() {
    console.log("Marking migration as applied...\n");

    try {
        // Read the migration file to get its hash
        const migrationPath = join(
            process.cwd(),
            "drizzle",
            "0000_consolidated_schema.sql",
        );
        const migrationContent = readFileSync(migrationPath, "utf-8");
        const hash = createHash("sha256")
            .update(migrationContent)
            .digest("hex");

        console.log(`Migration file: 0000_consolidated_schema.sql`);
        console.log(`Hash: ${hash}`);

        // Check if migration is already applied
        const existing = await db.execute(sql`
      SELECT * FROM drizzle.__drizzle_migrations
      WHERE hash = ${hash}
    `);

        if (
            existing.length > 0 ||
            (existing.rows && existing.rows.length > 0)
        ) {
            console.log(
                "\n✓ Migration is already marked as applied. Nothing to do.",
            );
            return;
        }

        // Insert the migration record
        const timestamp = Date.now();
        await db.execute(sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${timestamp})
    `);

        console.log("\n✓ Successfully marked migration as applied!");
        console.log(`   Timestamp: ${new Date(timestamp).toISOString()}`);

        // Verify
        const migrations = await db.execute(sql`
      SELECT hash, created_at
      FROM drizzle.__drizzle_migrations
      ORDER BY created_at
    `);
        const migrationList = migrations.rows || migrations;
        console.log(`\nTotal applied migrations: ${migrationList.length}`);
    } catch (error) {
        console.error("Error:", error);
        throw error;
    } finally {
        await client.end();
    }
}

markMigrationAsApplied();

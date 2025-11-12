import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) {
    throw new Error("DATABASE_URL_UNPOOLED is not set");
}

const client = postgres(connectionString);
const db = drizzle(client);

async function checkMigrationStatus() {
    console.log("Checking migration status...\n");

    try {
        // Check if drizzle schema exists
        const schemaExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata
        WHERE schema_name = 'drizzle'
      ) as exists
    `);
        console.log(
            "Drizzle schema exists:",
            schemaExists[0]?.exists ?? schemaExists.rows?.[0]?.exists,
        );

        // Check if migrations table exists
        const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'drizzle'
        AND table_name = '__drizzle_migrations'
      ) as exists
    `);
        console.log(
            "__drizzle_migrations table exists:",
            tableExists[0]?.exists ?? tableExists.rows?.[0]?.exists,
        );

        // If table exists, list migrations
        if (tableExists[0]?.exists ?? tableExists.rows?.[0]?.exists) {
            const migrations = await db.execute(sql`
        SELECT hash, created_at
        FROM drizzle.__drizzle_migrations
        ORDER BY created_at
      `);
            const migrationList = migrations.rows || migrations;
            console.log(`\nApplied migrations (${migrationList.length}):\n`);
            for (const migration of migrationList) {
                console.log(`  - Hash: ${migration.hash}`);
                console.log(
                    `    Created: ${new Date(Number(migration.created_at)).toISOString()}`,
                );
            }
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.end();
    }
}

checkMigrationStatus();

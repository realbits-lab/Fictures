/**
 * Database connection using Drizzle ORM with Neon PostgreSQL
 * Supports both Neon serverless (production) and standard PostgreSQL (testing)
 */

import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import * as schema from "@/lib/schemas/database";

const databaseUrl = process.env.DATABASE_URL ?? "";

console.log("[DB] DATABASE_URL:", databaseUrl);

// Detect if using standard PostgreSQL (testcontainers) or Neon
// Standard PostgreSQL uses postgres:// or postgresql://
// Neon serverless uses postgres:// but we detect by checking if it's a local/test database
const isLocalPostgres =
    databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");

console.log("[DB] isLocalPostgres:", isLocalPostgres);

// Create connection pool based on database type
let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePg>;

if (isLocalPostgres) {
    // Use standard PostgreSQL driver for local/test databases (testcontainers)
    const pool = new PgPool({ connectionString: databaseUrl });
    db = drizzlePg(pool, { schema });
    console.log("[DB] Using standard PostgreSQL driver (local/test)");
} else {
    // Use Neon serverless driver for production
    const pool = new NeonPool({ connectionString: databaseUrl });
    db = drizzleNeon(pool, { schema });
    console.log("[DB] Using Neon serverless driver (production)");
}

export { db };

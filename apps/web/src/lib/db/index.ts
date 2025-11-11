/**
 * Database connection using Drizzle ORM with Neon PostgreSQL
 */

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Create connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

// Initialize Drizzle with schema for query API support
export const db = drizzle(pool, { schema });

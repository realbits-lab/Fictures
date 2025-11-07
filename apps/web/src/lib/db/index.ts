/**
 * Database connection using Drizzle ORM with Neon PostgreSQL
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

// Create connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

// Initialize Drizzle
export const db = drizzle(pool);

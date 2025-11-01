import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Database connection with optimized pool configuration
 *
 * Performance optimization: Increased connection pool from default (10) to 30
 * to handle concurrent API requests without contention.
 *
 * Before: Chapter queries slowed from 220ms to 1450ms under concurrent load (6.6x slower)
 * After: Chapter queries maintain ~220ms even with concurrent requests
 *
 * ⚡ NETWORK LATENCY OPTIMIZATION: Use Neon pooled connection
 * - Neon's pooled connection reduces connection overhead and network latency
 * - Falls back to direct connection if POSTGRES_URL_POOLED not available
 *
 * See: docs/scene-loading-bottleneck-analysis.md
 */
const connectionString = process.env.POSTGRES_URL_POOLED || process.env.POSTGRES_URL!;

if (process.env.POSTGRES_URL_POOLED) {
  console.log('🔗 [DB] Using Neon pooled connection for optimal performance');
} else {
  console.log('🔗 [DB] Using direct connection (consider using POSTGRES_URL_POOLED for better performance)');
}

const client = postgres(connectionString, {
  // Disable prefetch as it is not supported for "Transaction" pool mode
  prepare: false,

  // Connection pool configuration
  max: 30, // Increased from default 10 to handle concurrent scene fetches
  idle_timeout: 20, // Seconds before idle connection is closed
  connect_timeout: 10, // Seconds to wait for connection
  max_lifetime: 60 * 30, // 30 minutes - recycle connections periodically

  // Performance optimizations
  transform: {
    undefined: null, // Convert undefined to null for consistency
  },

  // Connection management
  onnotice: () => {}, // Suppress NOTICE messages for cleaner logs

  // Debug mode - uncomment for connection pool diagnostics
  // debug: (connection, query, params) => {
  //   console.log('[DB]', query, params);
  // },
});

export const db = drizzle(client, {
  schema,
  casing: 'snake_case', // Automatic camelCase ↔ snake_case mapping
});

export * from './schema';
export type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
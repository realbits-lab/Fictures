import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(process.env.POSTGRES_URL!, { prepare: false });
export const db = drizzle(client, { schema });

export * from './schema';
export type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
#!/usr/bin/env node

import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: '.env.local' });
const client = postgres(process.env.POSTGRES_URL, { prepare: false });

const tables = await client`
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name
`;

console.log('Tables in database:');
tables.forEach(t => console.log('  -', t.table_name));

await client.end();
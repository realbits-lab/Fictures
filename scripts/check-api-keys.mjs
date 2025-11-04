#!/usr/bin/env node

import postgres from 'postgres';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function checkApiKeys() {
  try {
    console.log('\n🔑 Checking API keys in database...\n');

    const keys = await sql`
      SELECT
        ak.id,
        ak.user_id,
        u.email as user_email,
        ak.name,
        ak.scopes,
        ak.expires_at,
        ak.last_used_at,
        ak.created_at
      FROM api_keys ak
      LEFT JOIN users u ON ak.user_id = u.id
      ORDER BY ak.created_at DESC
      LIMIT 20
    `;

    console.log(`Found ${keys.length} API keys:\n`);

    for (const key of keys) {
      console.log(`🔑 ${key.name || 'Unnamed'}`);
      console.log(`   ID: ${key.id}`);
      console.log(`   User: ${key.user_email} (${key.user_id})`);
      console.log(`   Scopes: ${key.scopes?.join(', ') || 'None'}`);
      console.log(`   Expires: ${key.expires_at || 'Never'}`);
      console.log(`   Last used: ${key.last_used_at || 'Never'}`);
      console.log(`   Created: ${key.created_at}`);
      console.log('');
    }

    await sql.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

checkApiKeys();

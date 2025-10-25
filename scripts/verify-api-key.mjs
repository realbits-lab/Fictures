#!/usr/bin/env node

import { config } from 'dotenv';
import postgres from 'postgres';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: '.env.local' });

const AUTH_FILE = path.join(__dirname, '..', '.auth', 'user.json');

async function verifyApiKey() {
  const sql = postgres(process.env.POSTGRES_URL);

  try {
    // Load API key from .auth/user.json
    const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
    const writerProfile = authData.profiles?.writer;
    const apiKey = writerProfile.apiKey;

    console.log('Testing API key:', apiKey.substring(0, 20) + '...');

    // Compute hash
    const hash = createHash('sha256').update(apiKey).digest('hex');
    console.log('Computed hash:', hash);

    // Look up in database
    const result = await sql`
      SELECT ak.id, ak.key_prefix, ak.key_hash, ak.is_active, u.email
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.key_hash = ${hash}
    `;

    if (result.length > 0) {
      console.log('\n✅ API key is VALID');
      console.log('   Email:', result[0].email);
      console.log('   Key ID:', result[0].id);
      console.log('   Active:', result[0].is_active);
    } else {
      console.log('\n❌ API key NOT FOUND in database');
      console.log('   The key might be invalid or expired');
    }

    await sql.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyApiKey();

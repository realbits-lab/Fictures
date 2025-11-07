#!/usr/bin/env node

/**
 * Check API Keys in Database
 *
 * Verifies API keys stored in the database and compares them with .auth/user.json
 */

import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_FILE_PATH = path.join(__dirname, '../.auth/user.json');

async function main() {
  console.log('🔍 Checking API Keys in Database\n');

  // Load auth file
  const authData = JSON.parse(fs.readFileSync(AUTH_FILE_PATH, 'utf-8'));

  // Connect to database
  const sql = neon(process.env.DATABASE_URL);

  try {
    // Query all API keys with user information
    const result = await sql`
      SELECT
        u.email,
        u.name,
        u.role,
        ak.id as key_id,
        ak.name as key_name,
        ak.key_prefix,
        ak.key_hash,
        ak.scopes,
        ak.is_active,
        ak.created_at,
        ak.last_used_at,
        ak.expires_at
      FROM api_keys ak
      JOIN users u ON u.id = ak.user_id
      ORDER BY u.email, ak.created_at DESC
    `;

    console.log(`Found ${result.length} API key(s) in database:\n`);

    // Group by email
    const keysByEmail = {};
    for (const row of result) {
      if (!keysByEmail[row.email]) {
        keysByEmail[row.email] = [];
      }
      keysByEmail[row.email].push(row);
    }

    // Display and compare
    for (const [email, keys] of Object.entries(keysByEmail)) {
      console.log(`📧 ${email} (${keys[0].role}):`);

      keys.forEach((key, idx) => {
        console.log(`   ${idx === 0 ? 'Latest' : 'Old   '}: ${key.key_prefix}... (prefix only, key is hashed)`);
        console.log(`   Name: ${key.key_name}`);
        console.log(`   Scopes: ${JSON.stringify(key.scopes)}`);
        console.log(`   Active: ${key.is_active}`);
        console.log(`   Hash: ${key.key_hash.substring(0, 16)}...`);
        console.log(`   Created: ${new Date(key.created_at).toISOString()}`);
        console.log(`   Last used: ${key.last_used_at ? new Date(key.last_used_at).toISOString() : 'never'}`);
        console.log(`   Expires: ${key.expires_at ? new Date(key.expires_at).toISOString() : 'never'}`);
        console.log('');
      });

      // Compare with auth file
      const profile = email.split('@')[0];
      let authFileKey = null;
      let environment = null;

      // Check develop environment first (current environment)
      if (authData.develop?.profiles?.[profile]) {
        authFileKey = authData.develop.profiles[profile].apiKey;
        environment = 'develop';
      } else if (authData.main?.profiles?.[profile]) {
        authFileKey = authData.main.profiles[profile].apiKey;
        environment = 'main';
      }

      if (authFileKey) {
        const latestDbPrefix = keys[0].key_prefix;
        // Check if auth file key starts with the DB prefix
        const prefixMatches = authFileKey.startsWith(latestDbPrefix);

        console.log(`   Auth file (${environment}): ${authFileKey}`);
        console.log(`   DB prefix: ${latestDbPrefix}`);
        console.log(`   ${prefixMatches ? '✅ PREFIX MATCH' : '❌ PREFIX MISMATCH'}`);

        if (!prefixMatches) {
          console.log(`   ⚠️  WARNING: Auth file key prefix does not match database!`);
          console.log(`   This means the auth file key is NOT the same as the database key.`);
        }
        console.log('');
      } else {
        console.log(`   ⚠️  No matching profile in auth file\n`);
      }

      console.log('─'.repeat(80));
      console.log('');
    }

    // Summary
    console.log('\n📋 Summary:');
    console.log(`   Total users with API keys: ${Object.keys(keysByEmail).length}`);
    console.log(`   Total API keys: ${result.length}`);
    console.log(`   Active keys: ${result.filter(k => k.is_active).length}`);
    console.log('');
    console.log('ℹ️  Note: API keys in database are stored as hashes for security.');
    console.log('   Only the prefix is stored in plain text for identification.');
    console.log('   The full key is never stored in the database.\n');

  } catch (error) {
    console.error('❌ Error querying database:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

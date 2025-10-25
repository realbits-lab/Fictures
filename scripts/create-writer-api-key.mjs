#!/usr/bin/env node

import { config } from 'dotenv';
import postgres from 'postgres';
import { createHash, randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: '.env.local' });

const AUTH_FILE = path.join(__dirname, '..', '.auth', 'user.json');
const WRITER_USER_ID = 'usr_Ft3ZgJDMZIQQ';

// Generate API key function
function generateApiKey() {
  const randomKey = randomBytes(32).toString('base64url');
  const keyId = randomKey.substring(0, 12);
  const prefix = `fic_${keyId}`;
  const fullKey = `${prefix}_${randomKey}`;
  const hash = createHash('sha256').update(fullKey).digest('hex');

  return { fullKey, hash, prefix };
}

async function createWriterApiKey() {
  const sql = postgres(process.env.POSTGRES_URL);

  try {
    console.log('🔑 Creating new API key for writer@fictures.xyz...\n');

    // Generate new API key
    const { fullKey, hash, prefix } = generateApiKey();
    const keyId = `key_${Date.now()}`;

    // Insert into database
    const newKeys = await sql`
      INSERT INTO api_keys (
        id, user_id, name, key_hash, key_prefix, scopes, is_active, expires_at
      ) VALUES (
        ${keyId},
        ${WRITER_USER_ID},
        ${'Writer API Key'},
        ${hash},
        ${prefix},
        ${sql.json([
          'stories:read',
          'stories:write',
          'chapters:read',
          'chapters:write',
          'analytics:read',
          'ai:use',
          'community:read',
          'community:write',
          'settings:read'
        ])},
        ${true},
        ${null}
      )
      RETURNING id, key_prefix, scopes, created_at
    `;

    const newKey = newKeys[0];
    console.log('✅ API Key created successfully!');
    console.log(`   ID: ${newKey.id}`);
    console.log(`   Prefix: ${newKey.key_prefix}`);
    console.log(`   Full Key: ${fullKey}\n`);

    // Update .auth/user.json
    console.log('📝 Updating .auth/user.json...');

    let authData = {};
    if (fs.existsSync(AUTH_FILE)) {
      authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
    }

    if (!authData.profiles) {
      authData.profiles = {};
    }

    if (!authData.profiles.writer) {
      authData.profiles.writer = {
        userId: WRITER_USER_ID,
        email: 'writer@fictures.xyz',
        name: 'Writer User',
        role: 'writer'
      };
    }

    // Update API key data
    authData.profiles.writer.apiKey = fullKey;
    authData.profiles.writer.apiKeyId = keyId;
    authData.profiles.writer.apiKeyCreatedAt = new Date().toISOString();
    authData.profiles.writer.apiKeyScopes = [
      'stories:read',
      'stories:write',
      'chapters:read',
      'chapters:write',
      'analytics:read',
      'ai:use',
      'community:read',
      'community:write',
      'settings:read'
    ];

    fs.writeFileSync(AUTH_FILE, JSON.stringify(authData, null, 2));
    console.log('✅ Updated .auth/user.json\n');

    console.log('='.repeat(80));
    console.log('✅ WRITER API KEY CREATED AND SAVED');
    console.log('='.repeat(80));
    console.log(`\n🔑 API Key: ${fullKey}`);
    console.log(`📁 Saved to: .auth/user.json`);
    console.log(`\n✨ You can now use this key for API calls with writer@fictures.xyz`);
    console.log('='.repeat(80));

    await sql.end();
    return { fullKey, keyId };

  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    throw error;
  }
}

createWriterApiKey()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });

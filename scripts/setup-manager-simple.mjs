#!/usr/bin/env node

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';
import { nanoid } from 'nanoid';

// Load environment variables
config({ path: '.env.local' });

// Initialize database connection
const client = postgres(process.env.POSTGRES_URL, { prepare: false });
const db = drizzle(client);

// Generate API key
function generateApiKey() {
  const randomKey = randomBytes(32).toString('base64url');
  const keyId = randomKey.substring(0, 12);
  const prefix = `fic_${keyId}`;
  const fullKey = `${prefix}_${randomKey}`;
  const hash = createHash('sha256').update(fullKey).digest('hex');

  return { fullKey, hash, prefix };
}

async function setupManagerApiKey() {
  const managerEmail = 'manager@fictures.xyz';

  try {
    // Check if user exists - use postgres client directly
    const existingUsers = await client`
      SELECT id, email, name FROM users WHERE email = ${managerEmail}
    `;

    let userId;

    if (existingUsers.length > 0) {
      console.log('✅ User already exists:', managerEmail);
      userId = existingUsers[0].id;
    } else {
      // Create new user
      userId = nanoid();
      await client`
        INSERT INTO users (id, email, name, role, "createdAt", "updatedAt")
        VALUES (${userId}, ${managerEmail}, ${'API Manager'}, ${'writer'}, NOW(), NOW())
      `;

      console.log('✅ Created new user:', managerEmail);
    }

    // Generate new API key with all scopes
    const { fullKey, hash, prefix } = generateApiKey();
    const apiKeyId = nanoid();

    const allScopes = [
      'stories:read',
      'stories:write',
      'stories:delete',
      'stories:publish',
      'chapters:read',
      'chapters:write',
      'chapters:delete',
      'analytics:read',
      'ai:use',
      'community:read',
      'community:write',
      'settings:read',
      'settings:write'
    ];

    // Create API key in database
    await client`
      INSERT INTO api_keys (
        id, user_id, name, key_hash, key_prefix, scopes,
        expires_at, is_active, created_at, updated_at
      )
      VALUES (
        ${apiKeyId},
        ${userId},
        ${'Manager Testing Key'},
        ${hash},
        ${prefix},
        ${JSON.stringify(allScopes)}::json,
        NULL,
        true,
        NOW(),
        NOW()
      )
    `;

    console.log('\n========================================');
    console.log('🔑 API KEY GENERATED SUCCESSFULLY');
    console.log('========================================');
    console.log('User Email:', managerEmail);
    console.log('User ID:', userId);
    console.log('API Key ID:', apiKeyId);
    console.log('Key Prefix:', prefix);
    console.log('Scopes:', allScopes.join(', '));
    console.log('\n⚠️  SAVE THIS API KEY - IT WILL NOT BE SHOWN AGAIN:');
    console.log('----------------------------------------');
    console.log(fullKey);
    console.log('----------------------------------------\n');

    // Export to environment variable format
    console.log('To use in terminal, run:');
    console.log(`export API_KEY="${fullKey}"`);

    // Cleanup and exit
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up manager API key:', error);
    await client.end();
    process.exit(1);
  }
}

setupManagerApiKey();
#!/usr/bin/env node

/**
 * Setup Authentication Users
 *
 * Creates three user accounts with passwords and API keys:
 * - manager@fictures.xyz (manager role, full access)
 * - writer@fictures.xyz (writer role, read/write access)
 * - reader@fictures.xyz (reader role, read-only access)
 *
 * Generates secure passwords, hashes them with PBKDF2, and creates API keys.
 * Outputs simplified auth file structure with only email, password, and apiKey.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, apiKeys } from '../src/lib/db/schema.ts';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PBKDF2 password hashing (matching src/lib/auth/password.ts)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Import the password as a key
  const key = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );

  // Combine salt and derived key
  const hashArray = new Uint8Array(salt.length + new Uint8Array(derivedKey).length);
  hashArray.set(salt, 0);
  hashArray.set(new Uint8Array(derivedKey), salt.length);

  // Convert to base64
  return Buffer.from(hashArray).toString('base64');
}

// Generate secure random password
function generateSecurePassword(length = 24) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }

  return password;
}

// Generate API key
function generateApiKey() {
  const prefix = 'fic';
  const randomPart = crypto.randomBytes(32).toString('base64url');
  return `${prefix}_${randomPart}`;
}

// Hash API key for storage
async function hashApiKey(apiKey) {
  const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
  return hash;
}

// Get API key prefix (first 8 characters)
function getApiKeyPrefix(apiKey) {
  return apiKey.substring(0, 8);
}

// Generate unique ID
function generateId(prefix = 'usr') {
  return `${prefix}_${crypto.randomBytes(12).toString('base64url')}`;
}

// User configurations
const userConfigs = [
  {
    email: 'manager@fictures.xyz',
    name: 'Fictures Manager',
    username: 'manager',
    role: 'manager',
    scopes: [
      'stories:read', 'stories:write', 'stories:delete', 'stories:publish',
      'chapters:read', 'chapters:write', 'chapters:delete',
      'analytics:read',
      'ai:use',
      'community:read', 'community:write',
      'settings:read', 'settings:write',
      'admin:all'
    ]
  },
  {
    email: 'writer@fictures.xyz',
    name: 'Writer User',
    username: 'writer',
    role: 'writer',
    scopes: [
      'stories:read', 'stories:write',
      'chapters:read', 'chapters:write',
      'analytics:read',
      'ai:use',
      'community:read', 'community:write',
      'settings:read'
    ]
  },
  {
    email: 'reader@fictures.xyz',
    name: 'Reader User',
    username: 'reader',
    role: 'reader',
    scopes: [
      'stories:read',
      'chapters:read',
      'analytics:read',
      'community:read',
      'settings:read'
    ]
  }
];

async function main() {
  // Validate environment
  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!connectionString) {
    console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED not found in environment');
    process.exit(1);
  }

  console.log('🔐 Setting up authentication users...\n');

  // Connect to database
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { casing: 'snake_case' });

  const authData = {
    profiles: {}
  };

  try {
    for (const config of userConfigs) {
      console.log(`\n📝 Creating user: ${config.email}`);
      console.log(`   Role: ${config.role}`);
      console.log(`   Scopes: ${config.scopes.length} permissions`);

      // Generate password
      const plainPassword = generateSecurePassword(24);
      const hashedPassword = await hashPassword(plainPassword);

      console.log(`   ✓ Generated secure password (24 chars)`);

      // Check if user exists
      const existingUser = await db.select().from(users).where(eq(users.email, config.email)).limit(1);

      let userId;
      if (existingUser.length > 0) {
        console.log(`   ℹ User already exists, updating...`);
        userId = existingUser[0].id;

        // Update existing user
        await db.update(users)
          .set({
            name: config.name,
            username: config.username,
            password: hashedPassword,
            role: config.role,
            updatedAt: new Date().toISOString()
          })
          .where(eq(users.id, userId));

        console.log(`   ✓ Updated user account`);
      } else {
        // Create new user
        userId = generateId('usr');

        await db.insert(users).values({
          id: userId,
          email: config.email,
          name: config.name,
          username: config.username,
          password: hashedPassword,
          role: config.role,
          emailVerified: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        console.log(`   ✓ Created user account`);
      }

      // Generate API key
      const apiKey = generateApiKey();
      const keyHash = await hashApiKey(apiKey);
      const keyPrefix = getApiKeyPrefix(apiKey);
      const apiKeyId = generateId('key');

      // Delete existing API keys for this user
      await db.delete(apiKeys).where(eq(apiKeys.userId, userId));

      // Create new API key
      await db.insert(apiKeys).values({
        id: apiKeyId,
        userId: userId,
        name: `${config.role} API Key`,
        keyHash: keyHash,
        keyPrefix: keyPrefix,
        scopes: config.scopes,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log(`   ✓ Created API key`);

      // Store in auth data (simplified structure)
      authData.profiles[config.role] = {
        email: config.email,
        password: plainPassword,
        apiKey: apiKey
      };

      console.log(`   ✓ Added to auth profiles`);
    }

    // Write auth file
    const authFilePath = path.join(__dirname, '..', '.auth', 'user.json');
    const authDir = path.dirname(authFilePath);

    // Create .auth directory if it doesn't exist
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    fs.writeFileSync(authFilePath, JSON.stringify(authData, null, 2), 'utf-8');

    console.log('\n✅ Authentication setup complete!\n');
    console.log('📄 Auth file created: .auth/user.json\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔑 USER CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const [role, profile] of Object.entries(authData.profiles)) {
      console.log(`${role.toUpperCase()} (${profile.email}):`);
      console.log(`  Password: ${profile.password}`);
      console.log(`  API Key:  ${profile.apiKey}`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT:');
    console.log('  • Save these credentials securely');
    console.log('  • .auth/user.json is gitignored');
    console.log('  • Passwords are hashed with PBKDF2 in database');
    console.log('  • API keys are hashed with SHA-256 in database');
    console.log('\n📚 Documentation: docs/auth/authentication-profiles.md\n');

  } catch (error) {
    console.error('\n❌ Error setting up users:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

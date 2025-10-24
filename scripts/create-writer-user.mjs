import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import crypto from 'crypto';

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql);

async function createWriterUser() {
  // Generate secure password
  const password = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  const userId = 'usr_' + crypto.randomBytes(10).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 14);
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  const now = new Date();

  console.log('Creating writer user...\n');

  try {
    // Create the user
    const result = await sql`
      INSERT INTO users (id, name, email, "emailVerified", image, username, password, bio, role, "createdAt", "updatedAt")
      VALUES (
        ${userId},
        'Writer User',
        'writer@fictures.xyz',
        ${now},
        NULL,
        'writer',
        ${hashedPassword},
        'Writer account for testing',
        'writer',
        ${now},
        ${now}
      )
      RETURNING id, email, name, username, role;
    `;

    console.log('✓ User created successfully:');
    console.log('  ID:', result[0].id);
    console.log('  Email:', result[0].email);
    console.log('  Name:', result[0].name);
    console.log('  Role:', result[0].role);

    // Generate API key
    const apiKey = 'fic_' + crypto.randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 48);
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyPrefix = apiKey.substring(0, 16);
    const apiKeyId = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 21);
    const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const apiKeyResult = await sql`
      INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, scopes, last_used_at, expires_at, is_active, created_at, updated_at)
      VALUES (
        ${apiKeyId},
        ${userId},
        'Writer API Key',
        ${keyHash},
        ${keyPrefix},
        ${JSON.stringify(['stories:read', 'stories:write', 'stories:delete'])},
        NULL,
        ${expiresAt},
        true,
        ${now},
        ${now}
      )
      RETURNING id, user_id, name, key_prefix, scopes, created_at;
    `;

    console.log('\n✓ API Key created successfully:');
    console.log('  ID:', apiKeyResult[0].id);
    console.log('  Scopes:', apiKeyResult[0].scopes);

    // Update .auth/user.json
    const authPath = resolve(process.cwd(), '.auth/user.json');
    const authData = JSON.parse(readFileSync(authPath, 'utf-8'));

    authData.profiles.writer = {
      userId: userId,
      email: 'writer@fictures.xyz',
      password: password,
      name: 'Writer User',
      username: 'writer',
      role: 'writer',
      apiKey: apiKey,
      apiKeyId: apiKeyId,
      apiKeyCreatedAt: now.toISOString(),
      apiKeyScopes: ['stories:read', 'stories:write', 'stories:delete'],
      cookies: [],
      origins: []
    };

    writeFileSync(authPath, JSON.stringify(authData, null, 2));

    console.log('\n✓ Updated .auth/user.json with writer profile');
    console.log('\nWriter Profile Summary:');
    console.log('  Email: writer@fictures.xyz');
    console.log('  Password:', password);
    console.log('  User ID:', userId);
    console.log('  API Key:', apiKey);
    console.log('  API Key ID:', apiKeyId);
    console.log('\n✓ All credentials saved to .auth/user.json');

  } catch (error) {
    if (error.message && error.message.includes('duplicate key')) {
      console.error('\n✗ User with email writer@fictures.xyz already exists');

      const existingUser = await sql`
        SELECT id, email, name, username, role
        FROM users
        WHERE email = 'writer@fictures.xyz'
      `;

      console.log('\nExisting user:', existingUser[0]);
      console.log('\nTo update this user:');
      console.log('1. Delete the existing user from the database');
      console.log('2. Run this script again');
      console.log('\nOr update the password manually in the database and .auth/user.json');

    } else {
      console.error('\n✗ Error creating user:', error);
      throw error;
    }
  }
}

createWriterUser().catch(console.error);

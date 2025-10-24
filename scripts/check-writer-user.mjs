import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL is not set in environment variables');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function checkWriterUser() {
  try {
    // Load writer profile from .auth/user.json
    const authPath = resolve(process.cwd(), '.auth/user.json');
    const authData = JSON.parse(readFileSync(authPath, 'utf-8'));
    const writerProfile = authData.profiles?.writer;

    if (!writerProfile) {
      console.log('❌ Writer profile not found in .auth/user.json');
      console.log('Run: dotenv --file .env.local run node scripts/create-writer-user.mjs');
      return;
    }

    console.log('Checking writer@fictures.xyz user...\n');
    console.log('Profile from .auth/user.json:');
    console.log('  Email:', writerProfile.email);
    console.log('  User ID:', writerProfile.userId);
    console.log('  Password:', writerProfile.password ? '✓ Set' : '✗ Not set');
    console.log('  API Key:', writerProfile.apiKey ? '✓ Set' : '✗ Not set');
    console.log('  API Key ID:', writerProfile.apiKeyId);
    console.log('  Scopes:', writerProfile.apiKeyScopes?.join(', ') || 'None');

    // Query database
    const result = await client`
      SELECT id, email, name, role, password, "emailVerified", "createdAt"
      FROM users
      WHERE email = ${writerProfile.email}
      LIMIT 1
    `;

    console.log('\nDatabase check:');
    if (result.length === 0) {
      console.log('❌ User not found in database');
      console.log('The user may have been deleted. Run create-writer-user.mjs to recreate.');
    } else {
      const userData = result[0];
      console.log('✅ User found in database:');
      console.log('   ID:', userData.id);
      console.log('   Email:', userData.email);
      console.log('   Name:', userData.name);
      console.log('   Role:', userData.role);
      console.log('   Has Password:', userData.password ? '✅ Yes' : '❌ No');
      console.log('   Email Verified:', userData.emailVerified ? '✅ Yes' : '❌ No');
      console.log('   Created At:', userData.createdAt);

      // Check API keys
      const apiKeys = await client`
        SELECT id, name, key_prefix, scopes, is_active, created_at, expires_at
        FROM api_keys
        WHERE user_id = ${userData.id}
        ORDER BY created_at DESC
      `;

      console.log('\nAPI Keys:', apiKeys.length);
      apiKeys.forEach((key, idx) => {
        console.log(`\n  Key ${idx + 1}:`);
        console.log('    ID:', key.id);
        console.log('    Name:', key.name);
        console.log('    Prefix:', key.key_prefix);
        console.log('    Active:', key.is_active ? '✅' : '❌');
        console.log('    Scopes:', key.scopes.join(', '));
        console.log('    Created:', key.created_at);
        console.log('    Expires:', key.expires_at);
      });

      // Verify profile matches database
      if (userData.id !== writerProfile.userId) {
        console.log('\n⚠️  WARNING: User ID mismatch between .auth/user.json and database');
        console.log('  .auth/user.json:', writerProfile.userId);
        console.log('  Database:', userData.id);
      }
    }
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await client.end();
  }
}

checkWriterUser();

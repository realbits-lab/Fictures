import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Load authentication data from .auth/user.json
const authData = JSON.parse(readFileSync(resolve(process.cwd(), '.auth/user.json'), 'utf-8'));
const readerProfile = authData.profiles?.reader;

if (!readerProfile) {
  console.error('Reader profile not found in .auth/user.json');
  process.exit(1);
}

if (!readerProfile.password) {
  console.error('Reader profile does not have a password in .auth/user.json');
  process.exit(1);
}

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL is not set in environment variables');
  process.exit(1);
}

const client = postgres(connectionString);

async function verifyPassword() {
  try {
    console.log(`Verifying password for ${readerProfile.email}...\n`);

    // Get the user with password hash
    const result = await client`
      SELECT id, email, name, password
      FROM users
      WHERE email = ${readerProfile.email}
      LIMIT 1
    `;

    if (result.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = result[0];
    const providedPassword = readerProfile.password;

    console.log('User found:', user.email);
    console.log('User ID:', user.id);
    console.log('Stored password hash (first 20 chars):', user.password ? user.password.substring(0, 20) + '...' : 'NULL');
    console.log('\nVerifying password:', providedPassword);

    if (!user.password) {
      console.log('\n❌ User has no password set in database');
      return;
    }

    // Verify password using bcrypt
    const isValid = await bcrypt.compare(providedPassword, user.password);

    console.log('\nPassword verification result:', isValid ? '✅ VALID' : '❌ INVALID');

    if (!isValid) {
      console.log('\n⚠️  The provided password does not match the stored hash');
      console.log('Possible reasons:');
      console.log('1. The password was set to a different value');
      console.log('2. The password hash in the database is incorrect');
      console.log('3. The password you provided is incorrect');
    } else {
      console.log('\n✅ Password is correct! Login should work.');
      console.log('If login is still failing, check:');
      console.log('1. NextAuth configuration');
      console.log('2. Browser console for errors');
      console.log('3. Server logs for authentication errors');
    }
  } catch (error) {
    console.error('Error verifying password:', error);
  } finally {
    await client.end();
  }
}

verifyPassword();

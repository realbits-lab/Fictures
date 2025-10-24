import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

// Define users table schema inline
const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  username: varchar('username', { length: 50 }),
  password: varchar('password', { length: 255 }),
  bio: text('bio'),
  role: varchar('role', { length: 20 }),
  createdAt: timestamp('createdAt', { mode: 'date' }),
  updatedAt: timestamp('updatedAt', { mode: 'date' }),
});

// Generate a strong random password
function generateStrongPassword(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

// Hash password using PBKDF2 (matching the app's hashPassword function)
async function hashPasswordPBKDF2(password) {
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

async function changePassword() {
  try {
    // Check for database URL
    if (!process.env.POSTGRES_URL) {
      console.error('❌ Error: POSTGRES_URL environment variable is not set');
      process.exit(1);
    }

    // Connect to database
    const client = postgres(process.env.POSTGRES_URL);
    const db = drizzle(client);

    console.log('🔍 Looking for user manager@fictures.xyz...');

    // Find the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'manager@fictures.xyz'))
      .limit(1);

    if (!user) {
      console.error('❌ User manager@fictures.xyz not found in database');
      await client.end();
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || 'No name'} (${user.email})`);
    console.log(`   User ID: ${user.id}`);

    // Generate new strong password
    const newPassword = generateStrongPassword(16);
    console.log('\n🔐 Generated new strong password:');
    console.log('━'.repeat(60));
    console.log(`   ${newPassword}`);
    console.log('━'.repeat(60));
    console.log('\n⚠️  IMPORTANT: Save this password securely!');
    console.log('   This password will not be shown again.\n');

    // Hash the password using PBKDF2
    console.log('🔒 Hashing password with PBKDF2...');
    const hashedPassword = await hashPasswordPBKDF2(newPassword);

    // Update password in database
    console.log('💾 Updating password in database...');
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log('✅ Password changed successfully!');
    console.log('\nYou can now log in with:');
    console.log(`   Email: manager@fictures.xyz`);
    console.log(`   Password: ${newPassword}`);

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error changing password:', error);
    process.exit(1);
  }
}

changePassword();

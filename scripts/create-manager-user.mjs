#!/usr/bin/env node

/**
 * Create manager@fictures.xyz user account
 * Usage: dotenv --file .env.local run node scripts/create-manager-user.mjs
 */

import 'dotenv/config';
import postgres from 'postgres';
import { webcrypto } from 'node:crypto';

// Polyfill for Node.js environment
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

// Generate a strong random password
function generateStrongPassword(length = 20) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + symbols;

  // Ensure at least one character from each category
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Generate a user ID
function generateUserId() {
  return 'usr_' + crypto.randomUUID().replace(/-/g, '').substring(0, 24);
}

// PBKDF2 password hashing (matches src/lib/auth/password.ts)
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

async function main() {
  try {
    console.log('🔄 Creating manager@fictures.xyz user account...\n');

    // Check if user already exists
    const existing = await sql`
      SELECT id, email FROM users WHERE email = 'manager@fictures.xyz'
    `;

    if (existing.length > 0) {
      console.log('⚠️  User already exists!');
      console.log('  User ID:', existing[0].id);
      console.log('  Email:', existing[0].email);
      console.log('\nTo reset password, use:');
      console.log('  dotenv --file .env.local run node scripts/reset-manager-password.mjs manager@fictures.xyz');
      await sql.end();
      process.exit(0);
    }

    // Generate user ID and password
    const userId = generateUserId();
    const password = generateStrongPassword(20);

    console.log('✓ Generated user ID:', userId);
    console.log('✓ Generated strong 20-character password');

    // Hash the password
    console.log('\n🔐 Hashing password with PBKDF2...');
    const hashedPassword = await hashPassword(password);
    console.log('✓ Password hashed (Base64, 100k iterations, SHA-256)');

    // Create user
    console.log('\n📝 Creating user in database...');
    await sql`
      INSERT INTO users (id, email, name, username, role, password, "createdAt", "updatedAt")
      VALUES (
        ${userId},
        'manager@fictures.xyz',
        'Fictures Manager',
        'manager',
        'manager',
        ${hashedPassword},
        NOW(),
        NOW()
      )
    `;

    console.log('✓ User created successfully!');

    console.log('\n✅ Manager account created!');
    console.log(`\n${'='.repeat(60)}`);
    console.log('LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    console.log('Email: manager@fictures.xyz');
    console.log('Password:', password);
    console.log('Role: manager');
    console.log('User ID:', userId);
    console.log('='.repeat(60));
    console.log('\n⚠️  IMPORTANT: Save this password securely!');
    console.log('This is the only time it will be displayed.');
    console.log('\nTest the login at: http://localhost:3000/login');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

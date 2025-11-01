#!/usr/bin/env node

/**
 * Reset user password using PBKDF2 with auto-generated strong password
 * Usage: dotenv --file .env.local run node scripts/reset-manager-password.mjs <email>
 * Example: dotenv --file .env.local run node scripts/reset-manager-password.mjs manager@fictures.xyz
 */

import 'dotenv/config';
import postgres from 'postgres';
import { webcrypto } from 'node:crypto';

// Polyfill for Node.js environment
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

const sql = postgres(process.env.POSTGRES_URL, {
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
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Error: Email required');
    console.log('\nUsage: dotenv --file .env.local run node scripts/reset-manager-password.mjs <email>');
    console.log('Example: dotenv --file .env.local run node scripts/reset-manager-password.mjs manager@fictures.xyz');
    process.exit(1);
  }

  try {
    console.log(`🔄 Resetting password for ${email}...\n`);

    // Find user
    const users = await sql`
      SELECT id, email, name, role
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (users.length === 0) {
      console.error(`❌ Error: User ${email} not found in database`);
      console.log('\nAvailable users:');
      const allUsers = await sql`SELECT email, role FROM users ORDER BY email`;
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.role})`));
      await sql.end();
      process.exit(1);
    }

    const user = users[0];
    console.log('✓ Found user:', user.email);
    console.log('  User ID:', user.id);
    console.log('  Name:', user.name);
    console.log('  Role:', user.role);

    // Generate strong random password
    console.log('\n🎲 Generating strong random password...');
    const newPassword = generateStrongPassword(20);
    console.log('✓ Generated 20-character password with uppercase, lowercase, numbers, and symbols');

    // Hash the new password
    console.log('\n🔐 Hashing password with PBKDF2...');
    const hashedPassword = await hashPassword(newPassword);
    console.log('✓ Password hashed (Base64, 100k iterations, SHA-256)');

    // Update password in database
    await sql`
      UPDATE users
      SET password = ${hashedPassword},
          "updatedAt" = NOW()
      WHERE id = ${user.id}
    `;

    console.log('\n✅ Password reset successful!');
    console.log(`\n${'='.repeat(60)}`);
    console.log('LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    console.log('Email:', user.email);
    console.log('Password:', newPassword);
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

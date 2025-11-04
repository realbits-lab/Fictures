#!/usr/bin/env node

/**
 * Create user account with specified role
 * Usage: dotenv --file .env.local run node scripts/create-user.mjs <email> <role> [name] [username]
 * Example: dotenv --file .env.local run node scripts/create-user.mjs reader@fictures.xyz reader "Reader User" reader
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
    const email = process.argv[2];
    const role = process.argv[3];
    const name = process.argv[4];
    const username = process.argv[5];

    if (!email || !role) {
      console.error('❌ Error: Email and role required');
      console.log('\nUsage: dotenv --file .env.local run node scripts/create-user.mjs <email> <role> [name] [username]');
      console.log('\nRole must be one of: reader, writer, manager');
      console.log('\nExamples:');
      console.log('  node scripts/create-user.mjs reader@fictures.xyz reader "Reader User" reader');
      console.log('  node scripts/create-user.mjs writer@fictures.xyz writer "Writer User" writer');
      console.log('  node scripts/create-user.mjs manager@fictures.xyz manager "Manager User" manager');
      await sql.end();
      process.exit(1);
    }

    // Validate role
    const validRoles = ['reader', 'writer', 'manager'];
    if (!validRoles.includes(role)) {
      console.error(`❌ Error: Invalid role "${role}"`);
      console.log('\nRole must be one of: reader, writer, manager');
      await sql.end();
      process.exit(1);
    }

    console.log(`🔄 Creating ${email} user account...\n`);

    // Check if user already exists
    const existing = await sql`
      SELECT id, email FROM users WHERE email = ${email}
    `;

    if (existing.length > 0) {
      console.log('⚠️  User already exists!');
      console.log('  User ID:', existing[0].id);
      console.log('  Email:', existing[0].email);
      console.log('\nTo reset password, use:');
      console.log(`  dotenv --file .env.local run node scripts/reset-manager-password.mjs ${email}`);
      await sql.end();
      process.exit(0);
    }

    // Generate user ID and password
    const userId = generateUserId();
    const password = generateStrongPassword(20);

    // Derive name and username from email if not provided
    const finalName = name || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const finalUsername = username || email.split('@')[0].replace(/[._-]/g, '');

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
        ${email},
        ${finalName},
        ${finalUsername},
        ${role},
        ${hashedPassword},
        NOW(),
        NOW()
      )
    `;

    console.log('✓ User created successfully!');

    console.log('\n✅ Account created!');
    console.log(`\n${'='.repeat(60)}`);
    console.log('LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Name:', finalName);
    console.log('Username:', finalUsername);
    console.log('Role:', role);
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

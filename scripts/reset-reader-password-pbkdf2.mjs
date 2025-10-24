import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';
import { webcrypto } from 'crypto';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL is not set in environment variables');
  process.exit(1);
}

const client = postgres(connectionString);

// Hash a password using PBKDF2 (same as src/lib/auth/password.ts)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Generate a random salt
  const salt = webcrypto.getRandomValues(new Uint8Array(16));

  // Import the password as a key
  const key = await webcrypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2
  const derivedKey = await webcrypto.subtle.deriveBits(
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
  return btoa(String.fromCharCode(...hashArray));
}

// Verify a password against a hash (same as src/lib/auth/password.ts)
async function verifyPassword(password, hash) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    // Decode the hash
    const hashArray = new Uint8Array(atob(hash).split('').map(char => char.charCodeAt(0)));

    // Extract salt (first 16 bytes) and stored hash (remaining bytes)
    const salt = hashArray.slice(0, 16);
    const storedHash = hashArray.slice(16);

    // Import the password as a key
    const key = await webcrypto.subtle.importKey(
      'raw',
      data,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    // Derive key using the same parameters
    const derivedKey = await webcrypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      256
    );

    // Compare the derived key with stored hash
    const derivedArray = new Uint8Array(derivedKey);

    if (derivedArray.length !== storedHash.length) {
      return false;
    }

    for (let i = 0; i < derivedArray.length; i++) {
      if (derivedArray[i] !== storedHash[i]) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

async function resetPassword() {
  try {
    // Get the new password from command line argument
    const newPassword = process.argv[2];

    if (!newPassword) {
      console.error('❌ Please provide a new password as argument');
      console.log('Usage: node scripts/reset-reader-password-pbkdf2.mjs <new-password>');
      process.exit(1);
    }

    console.log('Resetting password for reader@fictures.xyz using PBKDF2...\n');

    // Check if user exists
    const result = await client`
      SELECT id, email
      FROM users
      WHERE email = 'reader@fictures.xyz'
      LIMIT 1
    `;

    if (result.length === 0) {
      console.log('❌ User "reader@fictures.xyz" not found');
      process.exit(1);
    }

    const user = result[0];
    console.log('✅ User found:', user.email);
    console.log('User ID:', user.id);

    // Hash the new password using PBKDF2
    console.log('\nHashing new password using PBKDF2...');
    const hashedPassword = await hashPassword(newPassword);
    console.log('✅ Password hashed (first 20 chars):', hashedPassword.substring(0, 20) + '...');

    // Update the password in database
    console.log('\nUpdating password in database...');
    await client`
      UPDATE users
      SET password = ${hashedPassword}
      WHERE email = 'reader@fictures.xyz'
    `;

    console.log('✅ Password updated successfully!\n');

    // Verify the new password
    console.log('Verifying new password...');
    const isValid = await verifyPassword(newPassword, hashedPassword);
    console.log('Verification result:', isValid ? '✅ VALID' : '❌ INVALID');

    if (isValid) {
      console.log('\n🎉 Password reset complete!');
      console.log('You can now login with:');
      console.log('   Email: reader@fictures.xyz');
      console.log('   Password: <the password you just set>');
    }
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetPassword();

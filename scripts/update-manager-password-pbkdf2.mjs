import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema.ts';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.POSTGRES_URL);
const db = drizzle(sql, { schema });

// Hash a password using PBKDF2 (matching the app's implementation)
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
  return btoa(String.fromCharCode(...hashArray));
}

async function updateManagerPassword() {
  try {
    // Read password from user.json file
    const userJsonPath = path.join(__dirname, '..', '.auth', 'user.json');
    const userJsonData = await fs.readFile(userJsonPath, 'utf-8');
    const userData = JSON.parse(userJsonData);

    const correctPassword = userData.managerCredentials.password;
    const managerEmail = userData.managerCredentials.email;

    console.log(`Processing password for ${managerEmail}...`);

    // Hash the password using PBKDF2
    const hashedPassword = await hashPassword(correctPassword);

    // Update the password for manager@fictures.xyz
    const result = await db
      .update(schema.users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(schema.users.email, managerEmail))
      .returning();

    if (result.length > 0) {
      console.log(`✅ Password updated successfully for ${managerEmail}`);
      console.log('User details:', {
        id: result[0].id,
        email: result[0].email,
        name: result[0].name,
        role: result[0].role
      });
    } else {
      console.log(`❌ User ${managerEmail} not found in database`);

      // Let's check if the user exists and create if not
      const existingUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, managerEmail));

      if (existingUser.length === 0) {
        console.log(`Creating new user ${managerEmail}...`);

        const newUser = await db
          .insert(schema.users)
          .values({
            id: userData.managerCredentials.userId,
            email: managerEmail,
            name: userData.managerCredentials.name,
            password: hashedPassword,
            role: userData.managerCredentials.role,
            createdAt: new Date(userData.managerCredentials.createdAt),
            updatedAt: new Date()
          })
          .returning();

        console.log('✅ User created successfully:', {
          id: newUser[0].id,
          email: newUser[0].email,
          name: newUser[0].name,
          role: newUser[0].role
        });
      }
    }

    console.log('\nYou can now login with:');
    console.log(`Email: ${managerEmail}`);
    console.log(`Password: ${correctPassword}`);

  } catch (error) {
    console.error('Error updating password:', error);
  }

  await sql.end();
  process.exit(0);
}

updateManagerPassword();
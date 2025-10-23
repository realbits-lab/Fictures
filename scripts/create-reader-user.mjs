import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import crypto from 'crypto';

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql);

async function createReaderUser() {
  // Load authentication data from .auth/user.json
  const authPath = resolve(process.cwd(), '.auth/user.json');
  const authData = JSON.parse(readFileSync(authPath, 'utf-8'));
  const readerProfile = authData.profiles?.reader;

  if (!readerProfile) {
    console.error('Reader profile not found in .auth/user.json');
    console.log('Please ensure .auth/user.json has a "reader" profile with required fields');
    process.exit(1);
  }

  if (!readerProfile.password) {
    console.error('Reader profile does not have a password in .auth/user.json');
    console.log('Please add a "password" field to the reader profile in .auth/user.json');
    process.exit(1);
  }

  const password = readerProfile.password;
  const userId = readerProfile.userId || 'usr_' + crypto.randomBytes(10).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 14);
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  const now = new Date();

  try {
    const result = await sql`
      INSERT INTO users (id, name, email, "emailVerified", image, username, password, bio, role, "createdAt", "updatedAt")
      VALUES (
        ${userId},
        ${readerProfile.name || 'Reader User'},
        ${readerProfile.email},
        ${now},
        NULL,
        ${readerProfile.username || 'reader'},
        ${hashedPassword},
        'Test reader account',
        ${readerProfile.role || 'reader'},
        ${now},
        ${now}
      )
      RETURNING id, email, name, username, role;
    `;

    console.log('User created successfully:');
    console.log(result[0]);
    console.log('\nCredentials loaded from .auth/user.json');
    console.log('Email:', readerProfile.email);
    console.log('User ID:', userId);

    // Update .auth/user.json with the userId if it was generated
    if (!readerProfile.userId) {
      readerProfile.userId = userId;
      writeFileSync(authPath, JSON.stringify(authData, null, 2));
      console.log('\n✓ Updated .auth/user.json with userId:', userId);
    }
  } catch (error) {
    if (error.message && error.message.includes('duplicate key')) {
      console.error(`User with email ${readerProfile.email} already exists`);
      const existingUser = await sql`SELECT id, email, name, username, role FROM users WHERE email = ${readerProfile.email}`;
      console.log('Existing user:', existingUser[0]);
      console.log('\nPassword will be updated from .auth/user.json');

      const updateResult = await sql`
        UPDATE users
        SET password = ${hashedPassword}, "updatedAt" = ${now}
        WHERE email = ${readerProfile.email}
        RETURNING id, email, name, username, role;
      `;
      console.log('User password updated:', updateResult[0]);
    } else {
      console.error('Error creating user:', error);
      throw error;
    }
  }
}

createReaderUser().catch(console.error);

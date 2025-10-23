import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
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

async function checkReaderUser() {
  try {
    console.log('Checking reader@fictures.xyz user...\n');

    // Query using raw SQL since we can't import schema in .mjs
    const result = await client`
      SELECT id, email, name, role, password, "emailVerified", "createdAt"
      FROM users
      WHERE email = 'reader@fictures.xyz'
      LIMIT 1
    `;

    const user = result;

    if (user.length === 0) {
      console.log('❌ User "reader@fictures.xyz" does not exist in the database');
      console.log('The user needs to be created first before attempting to login');
    } else {
      const userData = user[0];
      console.log('✅ User found:');
      console.log('   ID:', userData.id);
      console.log('   Email:', userData.email);
      console.log('   Name:', userData.name);
      console.log('   Role:', userData.role);
      console.log('   Has Password:', userData.password ? '✅ Yes' : '❌ No');
      console.log('   Email Verified:', userData.emailVerified ? '✅ Yes' : '❌ No');
      console.log('   Created At:', userData.createdAt);

      if (!userData.password) {
        console.log('\n⚠️  This user does not have a password set!');
        console.log('   The user was likely created through Google OAuth.');
        console.log('   To enable credentials login, a password needs to be set.');
      }
    }
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await client.end();
  }
}

checkReaderUser();

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql);

async function getManagerAccount() {
  try {
    const user = await sql`
      SELECT id, email, name, username, role, created_at
      FROM users
      WHERE email = 'manager@fictures.xyz'
    `;

    if (user.length > 0) {
      console.log('Manager account found:');
      console.log(user[0]);

      const apiKeys = await sql`
        SELECT id, name, key_prefix, scopes, created_at, expires_at, is_active
        FROM api_keys
        WHERE user_id = ${user[0].id}
        ORDER BY created_at DESC
      `;

      console.log('\nAPI Keys:');
      console.log(apiKeys);
    } else {
      console.log('Manager account not found');
    }
  } catch (error) {
    console.error('Error fetching manager account:', error);
    throw error;
  }
}

getManagerAccount().catch(console.error);

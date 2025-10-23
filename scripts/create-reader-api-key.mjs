import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql);

async function createApiKey() {
  const userId = 'usr_kzjHKbJiCH8FgO';

  const apiKey = 'fic_' + crypto.randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 48);
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const keyPrefix = apiKey.substring(0, 16);
  const apiKeyId = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 21);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  try {
    const result = await sql`
      INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, scopes, last_used_at, expires_at, is_active, created_at, updated_at)
      VALUES (
        ${apiKeyId},
        ${userId},
        'Reader Test API Key',
        ${keyHash},
        ${keyPrefix},
        ${JSON.stringify(['stories:read', 'stories:write'])},
        NULL,
        ${expiresAt},
        true,
        ${now},
        ${now}
      )
      RETURNING id, user_id, name, key_prefix, scopes, created_at;
    `;

    console.log('API Key created successfully:');
    console.log(result[0]);
    console.log('\nAPI Key (save this securely):');
    console.log(apiKey);
    console.log('\nAPI Key ID:', apiKeyId);
    console.log('Created at:', now.toISOString());
  } catch (error) {
    console.error('Error creating API key:', error);
    throw error;
  }
}

createApiKey().catch(console.error);

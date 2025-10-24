import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../src/lib/db';
import { users, apiKeys } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { generateApiKey } from '../src/lib/auth/api-keys';
import type { ApiScope } from '../src/lib/auth/api-keys';

async function setupManagerApiKey() {
  const managerEmail = 'manager@fictures.xyz';

  try {
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, managerEmail))
      .limit(1);

    let userId: string;

    if (existingUser) {
      console.log('✅ User already exists:', managerEmail);
      userId = existingUser.id;
    } else {
      // Create new user
      const newUserId = nanoid();
      const [newUser] = await db.insert(users).values({
        id: newUserId,
        email: managerEmail,
        name: 'API Manager',
        role: 'writer',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      console.log('✅ Created new user:', managerEmail);
      userId = newUser.id;
    }

    // Generate new API key with all scopes
    const { fullKey, hash, prefix } = generateApiKey();

    const allScopes: ApiScope[] = [
      'stories:read',
      'stories:write',
      'stories:delete',
      'stories:publish',
      'chapters:read',
      'chapters:write',
      'chapters:delete',
      'analytics:read',
      'ai:use',
      'community:read',
      'community:write',
      'settings:read',
      'settings:write'
    ];

    // Create API key in database
    const apiKeyId = nanoid();
    const [apiKey] = await db.insert(apiKeys).values({
      id: apiKeyId,
      userId: userId,
      name: 'Manager Testing Key',
      keyHash: hash,
      keyPrefix: prefix,
      scopes: allScopes,
      expiresAt: null, // Never expires
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log('\n========================================');
    console.log('🔑 API KEY GENERATED SUCCESSFULLY');
    console.log('========================================');
    console.log('User Email:', managerEmail);
    console.log('User ID:', userId);
    console.log('API Key ID:', apiKey.id);
    console.log('API Key Name:', apiKey.name);
    console.log('Key Prefix:', prefix);
    console.log('Scopes:', allScopes.join(', '));
    console.log('\n⚠️  SAVE THIS API KEY - IT WILL NOT BE SHOWN AGAIN:');
    console.log('----------------------------------------');
    console.log(fullKey);
    console.log('----------------------------------------\n');

    // Export to environment variable format
    console.log('To use in terminal, run:');
    console.log(`export API_KEY="${fullKey}"`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up manager API key:', error);
    process.exit(1);
  }
}

setupManagerApiKey();
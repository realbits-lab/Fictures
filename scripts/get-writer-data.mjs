#!/usr/bin/env node

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, apiKeys } from '../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function getWriterData() {
  try {
    const writer = await db.select().from(users).where(eq(users.email, 'writer@fictures.xyz')).limit(1);

    if (writer.length === 0) {
      console.log('❌ writer@fictures.xyz user not found in database');
      process.exit(1);
    }

    const user = writer[0];
    console.log('\n📋 User Data:');
    console.log(JSON.stringify({
      userId: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      role: user.role
    }, null, 2));

    // Get API key
    const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, user.id)).limit(1);

    if (keys.length > 0) {
      const key = keys[0];
      console.log('\n🔑 API Key Data:');
      console.log(JSON.stringify({
        apiKey: key.key,
        apiKeyId: key.id,
        apiKeyCreatedAt: key.createdAt,
        scopes: key.scopes
      }, null, 2));
    } else {
      console.log('\n⚠️  No API key found for this user');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

getWriterData();

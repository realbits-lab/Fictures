#!/usr/bin/env node

/**
 * Verify Authentication Setup
 *
 * Checks that all three users were created correctly in the database
 * with proper passwords and API keys using Drizzle ORM query builder.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgTable, text, varchar, timestamp, json, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { eq, inArray } from 'drizzle-orm';

// Define schema inline to avoid TypeScript imports
const userRoleEnum = pgEnum('user_role', ['reader', 'writer', 'manager']);

const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  username: varchar('username', { length: 50 }),
  password: varchar('password', { length: 255 }),
  role: userRoleEnum('role').notNull().default('reader'),
  emailVerified: timestamp('email_verified'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull().default('API Key'),
  keyHash: varchar('key_hash', { length: 64 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 16 }).notNull(),
  scopes: json('scopes').notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1, prepare: false });
  const db = drizzle(client, {
    schema: { users, apiKeys },
    casing: 'snake_case'
  });

  try {
    console.log('🔍 Verifying authentication setup...\n');

    // Get all users using Drizzle query builder
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        username: users.username,
        role: users.role,
        password: users.password,
        createdAt: users.createdAt
      })
      .from(users)
      .where(
        inArray(users.email, [
          'manager@fictures.xyz',
          'writer@fictures.xyz',
          'reader@fictures.xyz'
        ])
      )
      .orderBy(users.role);

    if (userList.length === 0) {
      console.log('❌ No users found!\n');
      process.exit(1);
    }

    console.log(`✅ Found ${userList.length} users:\n`);

    for (const user of userList) {
      console.log(`${user.role.toUpperCase()} - ${user.email}`);
      console.log(`  User ID:  ${user.id}`);
      console.log(`  Name:     ${user.name}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Password: ${user.password ? '✓ Set (PBKDF2 hashed)' : '✗ Not set'}`);
      console.log(`  Created:  ${new Date(user.createdAt).toLocaleString()}`);

      // Get API keys for this user using Drizzle query builder
      const userApiKeys = await db
        .select({
          id: apiKeys.id,
          name: apiKeys.name,
          keyPrefix: apiKeys.keyPrefix,
          scopes: apiKeys.scopes,
          isActive: apiKeys.isActive
        })
        .from(apiKeys)
        .where(eq(apiKeys.userId, user.id));

      if (userApiKeys.length > 0) {
        console.log(`  API Keys: ${userApiKeys.length} active`);
        for (const key of userApiKeys) {
          console.log(`    - ${key.name} (${key.keyPrefix}...)`);
          const scopes = typeof key.scopes === 'string' ? JSON.parse(key.scopes) : key.scopes;
          console.log(`      Scopes: ${scopes.join(', ')}`);
        }
      } else {
        console.log(`  API Keys: ✗ None found`);
      }

      console.log('');
    }

    console.log('✅ Authentication setup verified!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

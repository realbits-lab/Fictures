#!/usr/bin/env tsx

import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../src/lib/auth/password';
import fs from 'fs/promises';
import path from 'path';

// Read the manager credentials from .auth/user.json
async function main() {
  const authData = JSON.parse(
    await fs.readFile(path.join(process.cwd(), '.auth', 'user.json'), 'utf8')
  );
  const { managerCredentials } = authData;

  console.log('👤 Setting up manager user in database...');
  console.log(`   Email: ${managerCredentials.email}`);

  try {
    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, managerCredentials.email))
      .limit(1);

    if (existingUser.length > 0) {
      console.log('✅ Manager user already exists');
      console.log(`   User ID: ${existingUser[0].id}`);
      console.log(`   Role: ${existingUser[0].role}`);

      // Update the password if needed
      const hashedPassword = await hashPassword(managerCredentials.password);
      await db.update(users)
        .set({
          password: hashedPassword,
          role: managerCredentials.role || 'manager'
        })
        .where(eq(users.id, existingUser[0].id));

      console.log('✅ Password updated');
    } else {
      // Create new user
      const hashedPassword = await hashPassword(managerCredentials.password);

      const [newUser] = await db.insert(users).values({
        id: managerCredentials.userId,
        email: managerCredentials.email,
        name: managerCredentials.name,
        password: hashedPassword,
        role: managerCredentials.role || 'manager',
        emailVerified: new Date(),
      }).returning();

      console.log('✅ Manager user created successfully');
      console.log(`   User ID: ${newUser.id}`);
      console.log(`   Role: ${newUser.role}`);
    }

    console.log('✅ Manager user setup complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to setup manager user:', error);
    process.exit(1);
  }
}

main();
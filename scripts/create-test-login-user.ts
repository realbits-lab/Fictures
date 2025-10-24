#!/usr/bin/env tsx

import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../src/lib/auth/password';
import { nanoid } from 'nanoid';

async function main() {
  const testEmail = 'test@example.com';
  const testPassword = 'test123456';

  console.log('👤 Creating test user for login...');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);

  try {
    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    if (existingUser.length > 0) {
      console.log('✅ Test user already exists, updating password...');

      // Update the password
      const hashedPassword = await hashPassword(testPassword);
      await db.update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, existingUser[0].id));

      console.log('✅ Password updated');
      console.log(`   User ID: ${existingUser[0].id}`);
    } else {
      // Create new user
      const hashedPassword = await hashPassword(testPassword);

      const [newUser] = await db.insert(users).values({
        id: nanoid(),
        email: testEmail,
        name: 'Test User',
        password: hashedPassword,
        role: 'writer',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      console.log('✅ Test user created successfully');
      console.log(`   User ID: ${newUser.id}`);
      console.log(`   Role: ${newUser.role}`);
    }

    console.log('✅ Test user setup complete');
    console.log('\n📝 You can now login with:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create test user:', error);
    process.exit(1);
  }
}

main();
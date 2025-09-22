#!/usr/bin/env node

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Use tsx to handle TypeScript imports
const { execSync } = await import('child_process');
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the manager credentials from .auth/user.json
const authData = JSON.parse(await fs.readFile(path.join(__dirname, '..', '.auth', 'user.json'), 'utf8'));
const { managerCredentials } = authData;

async function setupManagerUser() {
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
  } catch (error) {
    console.error('❌ Failed to setup manager user:', error);
    throw error;
  }
}

// Run the setup
setupManagerUser()
  .then(() => {
    console.log('✅ Manager user setup complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
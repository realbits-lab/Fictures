#!/usr/bin/env npx tsx

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function getUserId() {
  try {
    const [testUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, 'jong95@gmail.com'))
      .limit(1);

    if (testUser) {
      console.log('👤 Test User Information:');
      console.log('   Email:', testUser.email);
      console.log('   User ID:', testUser.id);
    } else {
      console.log('❌ Test user not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

getUserId();
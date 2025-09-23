#!/usr/bin/env npx tsx

import { db } from '@/lib/db';
import { users, stories } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function changeToManager() {
  try {
    const storyId = 'UGZaiUBw8MGBlUFsJR6-B';

    // Check if manager user exists
    console.log('🔍 Looking for manager user...');
    const [managerUser] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(or(
        eq(users.email, 'manager@example.com'),
        eq(users.name, 'manager')
      ))
      .limit(1);

    let managerId: string;

    if (managerUser) {
      console.log('✅ Found existing manager user:');
      console.log('   ID:', managerUser.id);
      console.log('   Email:', managerUser.email);
      console.log('   Name:', managerUser.name);
      managerId = managerUser.id;
    } else {
      // Create manager user
      console.log('➕ Creating new manager user...');
      managerId = nanoid();

      await db.insert(users).values({
        id: managerId,
        name: 'manager',
        email: 'manager@example.com',
        image: null,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Created manager user:');
      console.log('   ID:', managerId);
      console.log('   Email: manager@example.com');
      console.log('   Name: manager');
    }

    // Update story to use manager as author
    console.log('\n🔧 Updating story author...');
    console.log('   Story ID:', storyId);
    console.log('   New Author ID:', managerId);

    await db
      .update(stories)
      .set({ authorId: managerId })
      .where(eq(stories.id, storyId));

    console.log('✅ Story author updated successfully!');

    // Verify the update
    const [updatedStory] = await db
      .select({
        id: stories.id,
        title: stories.title,
        authorId: stories.authorId
      })
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    if (updatedStory) {
      console.log('\n📖 Updated Story:');
      console.log('   Story ID:', updatedStory.id);
      console.log('   Title:', updatedStory.title);
      console.log('   Author ID:', updatedStory.authorId);
      console.log('   Author: manager');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

changeToManager();
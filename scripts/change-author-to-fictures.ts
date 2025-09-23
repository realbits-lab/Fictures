#!/usr/bin/env npx tsx

import { db } from '@/lib/db';
import { users, stories } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function changeAuthorToFictures() {
  try {
    const storyId = 'UGZaiUBw8MGBlUFsJR6-B';

    // Step 1: Check if manager@fictures.xyz user exists
    console.log('🔍 Looking for manager@fictures.xyz user...');
    const [ficturesUser] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.email, 'manager@fictures.xyz'))
      .limit(1);

    let ficturesUserId: string;

    if (ficturesUser) {
      console.log('✅ Found existing manager@fictures.xyz user:');
      console.log('   ID:', ficturesUser.id);
      console.log('   Email:', ficturesUser.email);
      console.log('   Name:', ficturesUser.name);
      ficturesUserId = ficturesUser.id;
    } else {
      // Create manager@fictures.xyz user
      console.log('➕ Creating new manager@fictures.xyz user...');
      ficturesUserId = nanoid();

      await db.insert(users).values({
        id: ficturesUserId,
        name: 'Fictures Manager',
        email: 'manager@fictures.xyz',
        image: null,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Created manager@fictures.xyz user:');
      console.log('   ID:', ficturesUserId);
      console.log('   Email: manager@fictures.xyz');
      console.log('   Name: Fictures Manager');
    }

    // Step 2: Update story to use manager@fictures.xyz as author
    console.log('\n🔧 Updating story author...');
    console.log('   Story ID:', storyId);
    console.log('   New Author ID:', ficturesUserId);

    await db
      .update(stories)
      .set({ authorId: ficturesUserId })
      .where(eq(stories.id, storyId));

    console.log('✅ Story author updated to manager@fictures.xyz!');

    // Step 3: Find and remove manager@example.com user
    console.log('\n🗑️ Looking for manager@example.com user to remove...');
    const [exampleUser] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.email, 'manager@example.com'))
      .limit(1);

    if (exampleUser) {
      console.log('   Found manager@example.com user:');
      console.log('   ID:', exampleUser.id);
      console.log('   Email:', exampleUser.email);

      // Check if this user has any other stories
      const userStories = await db
        .select({ id: stories.id, title: stories.title })
        .from(stories)
        .where(eq(stories.authorId, exampleUser.id))
        .limit(5);

      if (userStories.length > 0) {
        console.log('   ⚠️ User has other stories, not removing:');
        userStories.forEach(story => {
          console.log(`     - ${story.title} (${story.id})`);
        });
      } else {
        // Safe to remove user
        await db
          .delete(users)
          .where(eq(users.id, exampleUser.id));

        console.log('   ✅ Removed manager@example.com user from database');
      }
    } else {
      console.log('   No manager@example.com user found');
    }

    // Step 4: Verify the final result
    const [updatedStory] = await db
      .select({
        id: stories.id,
        title: stories.title,
        authorId: stories.authorId
      })
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    const [finalAuthor] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, updatedStory.authorId))
      .limit(1);

    console.log('\n📖 Final Story Details:');
    console.log('   Story ID:', updatedStory.id);
    console.log('   Title:', updatedStory.title);
    console.log('   Author ID:', updatedStory.authorId);
    console.log('   Author Email:', finalAuthor.email);
    console.log('   Author Name:', finalAuthor.name);

  } catch (error) {
    console.error('Error:', error);
  }
}

changeAuthorToFictures();
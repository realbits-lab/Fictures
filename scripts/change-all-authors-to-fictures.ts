#!/usr/bin/env npx tsx

import { db } from '@/lib/db';
import { users, stories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function changeAllAuthorsToFictures() {
  try {
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

    // Step 2: Get all stories and update their authors
    console.log('\n🔧 Updating all stories to use manager@fictures.xyz as author...');
    const allStories = await db
      .select({ id: stories.id, title: stories.title, authorId: stories.authorId })
      .from(stories);

    if (allStories.length === 0) {
      console.log('📝 No stories found in database');
      return;
    }

    console.log(`📝 Found ${allStories.length} stories to update:`);
    allStories.forEach(story => {
      console.log(`   - "${story.title}" (${story.id}) - Current author: ${story.authorId}`);
    });

    // Update all stories
    const updateResult = await db
      .update(stories)
      .set({
        authorId: ficturesUserId,
        updatedAt: new Date()
      });

    console.log(`✅ Updated all ${allStories.length} stories to use manager@fictures.xyz as author!`);

    // Step 3: Verify the updates
    console.log('\n📖 Verifying updates...');
    const updatedStories = await db
      .select({
        id: stories.id,
        title: stories.title,
        authorId: stories.authorId
      })
      .from(stories);

    console.log('✅ Final story authors:');
    for (const story of updatedStories) {
      const [author] = await db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, story.authorId))
        .limit(1);

      console.log(`   - "${story.title}": ${author?.email || 'Unknown'} (${author?.name || 'Unknown'})`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

changeAllAuthorsToFictures();
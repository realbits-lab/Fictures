#!/usr/bin/env npx tsx

import { db } from '@/lib/db';
import { users, stories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function updateStoriesToManagerId() {
  try {
    const managerId = '9BtJ92KfArbhUbIN3U6iQ';

    // Step 1: Verify the user exists
    console.log('🔍 Verifying manager@fictures.xyz user...');
    const [managerUser] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, managerId))
      .limit(1);

    if (!managerUser) {
      console.error('❌ User with ID 9BtJ92KfArbhUbIN3U6iQ not found!');
      return;
    }

    console.log('✅ Found user:');
    console.log('   ID:', managerUser.id);
    console.log('   Email:', managerUser.email);
    console.log('   Name:', managerUser.name);

    // Step 2: Get all stories
    console.log('\n📖 Getting all stories...');
    const allStories = await db
      .select({ id: stories.id, title: stories.title, authorId: stories.authorId })
      .from(stories);

    if (allStories.length === 0) {
      console.log('📝 No stories found in database');
      return;
    }

    console.log(`📝 Found ${allStories.length} stories:`);
    allStories.forEach(story => {
      console.log(`   - "${story.title}" (${story.id}) - Current author: ${story.authorId}`);
    });

    // Step 3: Update all stories to use the manager ID
    console.log('\n🔧 Updating all stories to author ID:', managerId);
    const updateResult = await db
      .update(stories)
      .set({
        authorId: managerId,
        updatedAt: new Date()
      });

    console.log(`✅ Updated all ${allStories.length} stories!`);

    // Step 4: Verify updates
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
      console.log(`   - "${story.title}" (${story.id}): Author ID = ${story.authorId}`);

      if (story.authorId === managerId) {
        console.log('     ✅ Correctly set to manager@fictures.xyz');
      } else {
        console.log('     ❌ Author ID mismatch!');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateStoriesToManagerId();
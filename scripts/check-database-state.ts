import { db } from '@/lib/db';
import { users, stories, chapters, scenes } from '@/lib/db/schema';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function checkDatabaseState() {
  console.log('🔍 Checking database state...\n');

  try {
    // Check users
    const allUsers = await db.select().from(users);
    console.log(`👤 Users: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id})`);
    });

    // Check stories
    const allStories = await db.select().from(stories);
    console.log(`\n📚 Stories: ${allStories.length}`);
    allStories.forEach(story => {
      console.log(`   - "${story.title}" by ${story.authorId}`);
    });

    // Check chapters
    const allChapters = await db.select().from(chapters);
    console.log(`\n📖 Chapters: ${allChapters.length}`);
    const chaptersByStory = new Map();
    allChapters.forEach(chapter => {
      if (!chaptersByStory.has(chapter.storyId)) {
        chaptersByStory.set(chapter.storyId, []);
      }
      chaptersByStory.get(chapter.storyId).push(chapter);
    });

    chaptersByStory.forEach((chaps, storyId) => {
      console.log(`   Story ${storyId}: ${chaps.length} chapters`);
      chaps.forEach(ch => {
        console.log(`      - "${ch.title}" (Status: ${ch.status})`);
      });
    });

    // Check scenes
    const allScenes = await db.select().from(scenes);
    console.log(`\n📝 Scenes: ${allScenes.length}`);

  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }

  process.exit(0);
}

checkDatabaseState();
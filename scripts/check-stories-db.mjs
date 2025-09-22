import { config } from 'dotenv';
import { db } from '../src/lib/db/index.js';
import { stories, chapters, scenes, characters, settings } from '../src/lib/db/schema.js';

config({ path: '.env.local' });

async function checkStories() {
  try {
    const allStories = await db.select().from(stories);
    const allChapters = await db.select().from(chapters);
    const allScenes = await db.select().from(scenes);
    const allCharacters = await db.select().from(characters);
    const allSettings = await db.select().from(settings);

    console.log('📊 Database Status:');
    console.log(`   Stories: ${allStories.length}`);
    console.log(`   Chapters: ${allChapters.length}`);
    console.log(`   Scenes: ${allScenes.length}`);
    console.log(`   Characters: ${allCharacters.length}`);
    console.log(`   Settings: ${allSettings.length}`);

    if (allStories.length > 0) {
      console.log('\n📚 Stories in database:');
      allStories.forEach(story => {
        console.log(`\n   ID: ${story.id}`);
        console.log(`   Title: ${story.title}`);
        console.log(`   Genre: ${story.genre?.join(', ')}`);
        console.log(`   Theme: ${story.theme}`);
        console.log(`   Status: ${story.status}`);
        console.log(`   Created: ${story.createdAt}`);
      });

      // Show chapter count per story
      console.log('\n📖 Story Structure:');
      for (const story of allStories) {
        const storyChapters = allChapters.filter(ch => ch.storyId === story.id);
        const storyScenes = allScenes.filter(sc => sc.storyId === story.id);
        console.log(`   ${story.title}:`);
        console.log(`      - ${storyChapters.length} chapters`);
        console.log(`      - ${storyScenes.length} scenes`);
      }
    } else {
      console.log('\n❌ No stories found in database');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking stories:', error);
    process.exit(1);
  }
}

checkStories();
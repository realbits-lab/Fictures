import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const sql = postgres(process.env.POSTGRES_URL);

async function checkStoryProgress() {
  try {
    console.log('📊 Checking story generation progress...\n');

    const storyId = 'BGG8trYiwfuiQ5MroR2Uj';

    // Check story
    const story = await sql`SELECT * FROM stories WHERE id = ${storyId}`;
    console.log(`📖 Story: ${story.length > 0 ? '✅ Found' : '❌ Not found'}`);
    if (story.length > 0) {
      console.log(`   Title: ${story[0].title}`);
      console.log(`   Status: ${story[0].status}`);
    }

    // Check parts
    const parts = await sql`SELECT * FROM parts WHERE story_id = ${storyId}`;
    console.log(`\n📚 Parts: ${parts.length} found`);
    parts.forEach(part => {
      console.log(`   - ${part.title} (${part.structural_role})`);
    });

    // Check characters
    const characters = await sql`SELECT * FROM characters WHERE story_id = ${storyId}`;
    console.log(`\n👥 Characters: ${characters.length} found`);
    characters.forEach(char => {
      console.log(`   - ${char.name} (${char.role})`);
    });

    // Check settings
    const settings = await sql`SELECT * FROM settings WHERE story_id = ${storyId}`;
    console.log(`\n🏘️ Settings: ${settings.length} found`);
    settings.forEach(setting => {
      console.log(`   - ${setting.name}: ${setting.description?.substring(0, 50)}...`);
    });

    // Check chapters
    const chapters = await sql`SELECT * FROM chapters WHERE story_id = ${storyId}`;
    console.log(`\n📑 Chapters: ${chapters.length} found`);
    chapters.forEach(chapter => {
      console.log(`   - ${chapter.title} (order: ${chapter.order_index})`);
    });

    // Check scenes
    const scenes = await sql`
      SELECT s.* FROM scenes s
      JOIN chapters c ON s.chapter_id = c.id
      WHERE c.story_id = ${storyId}
    `;
    console.log(`\n🎬 Scenes: ${scenes.length} found`);
    scenes.forEach(scene => {
      console.log(`   - ${scene.title} (order: ${scene.order_index})`);
    });

    console.log('\n📈 Analysis:');
    if (parts.length === 0) {
      console.log('❌ Phase 2 (parts) not completed - this might be where it\'s stuck');
    } else if (characters.length === 0) {
      console.log('❌ Phase 3 (characters) not completed');
    } else if (settings.length === 0) {
      console.log('❌ Phase 4 (settings) not completed');
    } else if (chapters.length === 0) {
      console.log('❌ Phase 5 (chapters) not completed - this is where it\'s stuck');
    } else if (scenes.length === 0) {
      console.log('❌ Phase 6 (scenes) not completed - this is where it\'s stuck');
    } else {
      console.log('✅ Structure complete, ready for Phase 7 (content)');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkStoryProgress();
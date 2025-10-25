#!/usr/bin/env node

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL, {
  ssl: 'require'
});

async function main() {
  const storyId = process.argv[2];

  if (!storyId) {
    console.error('❌ Usage: node scripts/get-story-details.mjs STORY_ID');
    process.exit(1);
  }

  try {
    const [story] = await sql`
      SELECT * FROM stories WHERE id = ${storyId}
    `;

    if (!story) {
      throw new Error('Story not found');
    }

    const parts = await sql`
      SELECT COUNT(*) as count FROM parts WHERE story_id = ${storyId}
    `;

    const chapters = await sql`
      SELECT COUNT(*) as count FROM chapters WHERE story_id = ${storyId}
    `;

    const scenes = await sql`
      SELECT COUNT(*) as count FROM scenes 
      WHERE chapter_id IN (SELECT id FROM chapters WHERE story_id = ${storyId})
    `;

    const characters = await sql`
      SELECT COUNT(*) as total, COUNT(image_url) as with_images 
      FROM characters WHERE story_id = ${storyId}
    `;

    const settings = await sql`
      SELECT COUNT(*) as total, COUNT(image_url) as with_images 
      FROM settings WHERE story_id = ${storyId}
    `;

    console.log('\n📖 STORY DETAILS:\n');
    console.log(`Title: ${story.title}`);
    console.log(`ID: ${story.id}`);
    console.log(`Genre: ${story.genre}`);
    console.log(`Status: ${story.status}`);
    console.log(`Created: ${new Date(story.created_at).toLocaleString()}`);
    
    console.log('\n📊 STRUCTURE:\n');
    console.log(`📚 Parts: ${parts[0].count}`);
    console.log(`📝 Chapters: ${chapters[0].count}`);
    console.log(`🎬 Scenes: ${scenes[0].count}`);
    console.log(`👥 Characters: ${characters[0].total} (${characters[0].with_images} with images)`);
    console.log(`🏞️  Settings: ${settings[0].total} (${settings[0].with_images} with images)`);

    console.log('\n🔗 NAVIGATION:\n');
    console.log(`Community: http://localhost:3000/community/story/${story.id}`);
    console.log(`Edit: http://localhost:3000/writing/${story.id}`);
    console.log(`Read: http://localhost:3000/reading/${story.id}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();

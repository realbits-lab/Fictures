#!/usr/bin/env node

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL, {
  ssl: 'require'
});

async function main() {
  const storyId = process.argv[2];

  if (!storyId) {
    console.error('❌ Usage: node scripts/publish-story-db.mjs STORY_ID');
    process.exit(1);
  }

  try {
    console.log(`📤 Publishing story: ${storyId}...`);

    const result = await sql`
      UPDATE stories 
      SET status = 'published', updated_at = NOW()
      WHERE id = ${storyId}
      RETURNING id, title, status, genre
    `;

    if (result.length === 0) {
      throw new Error('Story not found');
    }

    const story = result[0];
    
    console.log('\n✅ Story published successfully!\n');
    console.log(`📖 Title: ${story.title}`);
    console.log(`🆔 ID: ${story.id}`);
    console.log(`📊 Status: ${story.status}`);
    console.log(`🎭 Genre: ${story.genre}`);
    console.log(`\n🔗 View at: http://localhost:3000/community/story/${story.id}`);
    console.log(`📝 Edit at: http://localhost:3000/writing/${story.id}`);
    console.log(`📖 Read at: http://localhost:3000/reading/${story.id}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();

import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const connectionString = process.env.POSTGRES_URL;
const client = postgres(connectionString);

async function testQuery() {
  try {
    console.log('🔍 Testing featured story query...\n');

    // Exact query from the code
    const result = await client`
      SELECT
        s.id,
        s.title,
        s.description,
        s.genre,
        s.view_count,
        s.rating,
        s.rating_count,
        s.current_word_count,
        s.status,
        u.id as author_id,
        u.name as author_name,
        u.username as author_username,
        u.image as author_image,
        COUNT(c.id) as chapter_count
      FROM stories s
      LEFT JOIN users u ON s.author_id = u.id
      LEFT JOIN chapters c ON c.story_id = s.id AND c.status = 'published'
      WHERE s.status = 'published'
      GROUP BY s.id, s.title, s.description, s.genre, s.view_count, s.rating,
               s.rating_count, s.current_word_count, s.status,
               u.id, u.name, u.username, u.image
      HAVING COUNT(c.id) > 0
      ORDER BY s.rating DESC NULLS LAST,
               s.view_count DESC NULLS LAST,
               s.current_word_count DESC NULLS LAST
      LIMIT 1
    `;

    console.log(`📊 Result count: ${result.length}`);

    if (result.length > 0) {
      console.log('\n✅ Found featured story:');
      const story = result[0];
      console.log(`  - ID: ${story.id}`);
      console.log(`  - Title: ${story.title}`);
      console.log(`  - Author: ${story.author_name}`);
      console.log(`  - Chapters: ${story.chapter_count}`);
      console.log(`  - Rating: ${story.rating}`);
      console.log(`  - Views: ${story.view_count}`);
      console.log(`  - Words: ${story.current_word_count}`);
      console.log('\n📋 Full story object:');
      console.log(JSON.stringify(story, null, 2));
    } else {
      console.log('\n❌ No results found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

testQuery();

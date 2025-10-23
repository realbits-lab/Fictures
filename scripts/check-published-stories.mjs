import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('❌ POSTGRES_URL not found in environment');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function checkStories() {
  try {
    console.log('🔍 Checking database for stories and chapters...\n');

    // Check total stories
    const totalStories = await client`SELECT COUNT(*) as count FROM stories`;
    console.log(`📚 Total stories: ${totalStories[0].count}`);

    // Check published stories
    const publishedStories = await client`SELECT COUNT(*) as count FROM stories WHERE status = 'published'`;
    console.log(`✅ Published stories: ${publishedStories[0].count}`);

    // Check stories with chapters
    const storiesWithChapters = await client`
      SELECT s.id, s.title, s.status, COUNT(c.id) as chapter_count
      FROM stories s
      LEFT JOIN chapters c ON c.story_id = s.id
      GROUP BY s.id, s.title, s.status
      HAVING COUNT(c.id) > 0
      ORDER BY COUNT(c.id) DESC
      LIMIT 10
    `;

    console.log(`\n📖 Stories with chapters (top 10):`);
    storiesWithChapters.forEach(story => {
      console.log(`  - ${story.title} (${story.status}): ${story.chapter_count} chapters`);
    });

    // Check published stories with published chapters
    const publishedWithPublishedChapters = await client`
      SELECT s.id, s.title, s.status, s.rating, s.view_count, COUNT(c.id) as chapter_count
      FROM stories s
      LEFT JOIN chapters c ON c.story_id = s.id AND c.status = 'published'
      WHERE s.status = 'published'
      GROUP BY s.id, s.title, s.status, s.rating, s.view_count
      HAVING COUNT(c.id) > 0
      ORDER BY s.rating DESC NULLS LAST, s.view_count DESC NULLS LAST
      LIMIT 10
    `;

    console.log(`\n✨ Published stories with published chapters:`);
    if (publishedWithPublishedChapters.length === 0) {
      console.log('  ⚠️ NONE FOUND - This is why the featured story is not showing!');
    } else {
      publishedWithPublishedChapters.forEach(story => {
        console.log(`  - ${story.title}: ${story.chapter_count} published chapters, rating: ${story.rating || 'N/A'}, views: ${story.view_count || 0}`);
      });
    }

    // Check chapter statuses
    const chapterStatuses = await client`
      SELECT status, COUNT(*) as count FROM chapters GROUP BY status
    `;
    console.log(`\n📄 Chapter statuses:`);
    chapterStatuses.forEach(status => {
      console.log(`  - ${status.status}: ${status.count}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkStories();

import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const sql = postgres(process.env.POSTGRES_URL);

async function verifyDeletion() {
  try {
    console.log('🔍 Verifying Chrono-Fracture story deletion...\n');

    // Check if story exists
    const stories = await sql`
      SELECT id, title FROM stories
      WHERE title ILIKE '%Chrono-Fracture%'
    `;

    if (stories.length === 0) {
      console.log('✅ Story "Chrono-Fracture" has been successfully deleted!\n');
    } else {
      console.log('⚠️  Story "Chrono-Fracture" still exists:\n', stories);
    }

    // List all remaining stories
    console.log('📚 Remaining stories in database:');
    const allStories = await sql`
      SELECT id, title, status FROM stories
      ORDER BY title
    `;

    if (allStories.length === 0) {
      console.log('   (no stories found)');
    } else {
      allStories.forEach((story, index) => {
        console.log(`   ${index + 1}. ${story.title} (${story.status})`);
      });
    }
    console.log(`\n   Total: ${allStories.length} stories`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

verifyDeletion();

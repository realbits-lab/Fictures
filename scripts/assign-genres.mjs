import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const sql = postgres(process.env.POSTGRES_URL);

// Valid genres
const VALID_GENRES = ['Fantasy', 'Science Fiction', 'Romance', 'Mystery', 'Thriller', 'Detective', 'Adventure'];

// Genre mapping based on story title/description keywords
const genreKeywords = {
  'Fantasy': ['magic', 'wizard', 'dragon', 'fantasy', 'realm', 'spell', 'enchanted', 'whispering woods', 'lyra'],
  'Science Fiction': ['space', 'planet', 'mars', 'jupiter', 'sci-fi', 'science fiction', 'alien', 'starship', 'galaxy', 'maw', 'red planet', 'tunguska'],
  'Mystery': ['mystery', 'secret', 'hidden', 'clue', 'detective', 'investigation', 'eidetic', 'echo'],
  'Detective': ['detective', 'investigate', 'solve', 'case', 'crime'],
  'Thriller': ['thriller', 'suspense', 'danger', 'chase'],
  'Romance': ['love', 'romance', 'heart', 'passion'],
  'Adventure': ['adventure', 'journey', 'quest', 'road', 'expedition', 'last road', 'trip']
};

function determineGenre(title, description) {
  const text = `${title} ${description || ''}`.toLowerCase();

  // Check each genre's keywords
  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return genre;
      }
    }
  }

  // Default genre if no match
  return 'Adventure';
}

async function assignGenres() {
  try {
    console.log('🔍 Fetching all stories...\n');

    // Get all stories
    const stories = await sql`
      SELECT id, title, description, genre
      FROM stories
      ORDER BY title
    `;

    console.log(`📚 Found ${stories.length} stories\n`);

    let updatedCount = 0;

    for (const story of stories) {
      let newGenre = story.genre;

      // If genre is null, empty, or not in valid list, assign a genre
      if (!newGenre || newGenre.trim() === '' || !VALID_GENRES.includes(newGenre)) {
        newGenre = determineGenre(story.title, story.description);

        // Update the story
        await sql`
          UPDATE stories
          SET genre = ${newGenre}
          WHERE id = ${story.id}
        `;

        console.log(`✓ Updated: "${story.title}"`);
        console.log(`  Old genre: ${story.genre || '(none)'}`);
        console.log(`  New genre: ${newGenre}\n`);
        updatedCount++;
      } else {
        console.log(`✓ Kept: "${story.title}" - ${newGenre}`);
      }
    }

    console.log(`\n✅ Finished! Updated ${updatedCount} of ${stories.length} stories.`);

    // Show genre distribution
    console.log('\n📊 Genre Distribution:');
    const distribution = await sql`
      SELECT genre, COUNT(*)::int as count
      FROM stories
      WHERE genre IS NOT NULL
      GROUP BY genre
      ORDER BY count DESC
    `;

    distribution.forEach(row => {
      console.log(`   ${row.genre}: ${row.count} ${row.count === 1 ? 'story' : 'stories'}`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

assignGenres();

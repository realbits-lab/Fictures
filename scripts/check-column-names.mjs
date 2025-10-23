import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const connectionString = process.env.POSTGRES_URL;
const client = postgres(connectionString);

async function checkColumnNames() {
  try {
    console.log('🔍 Checking actual database column names...\n');

    // Get column names from stories table
    const storiesColumns = await client`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'stories'
      ORDER BY ordinal_position
    `;

    console.log('📚 Stories table columns:');
    storiesColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    // Get column names from chapters table
    const chaptersColumns = await client`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'chapters'
      ORDER BY ordinal_position
    `;

    console.log('\n📖 Chapters table columns:');
    chaptersColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    // Try a simple query to see what data looks like
    const sampleStory = await client`
      SELECT * FROM stories LIMIT 1
    `;

    console.log('\n📊 Sample story data (column names):');
    if (sampleStory.length > 0) {
      Object.keys(sampleStory[0]).forEach(key => {
        console.log(`  - ${key}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkColumnNames();

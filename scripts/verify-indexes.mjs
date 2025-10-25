import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function verifyIndexes() {
  console.log('\n🔍 Verifying Database Indexes\n');

  const client = await pool.connect();

  try {
    // Query to get all indexes on our tables
    const result = await client.query(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('stories', 'chapters', 'parts', 'scenes', 'characters', 'ai_interactions')
      ORDER BY tablename, indexname;
    `);

    console.log(`📊 Found ${result.rows.length} indexes total\n`);

    // Group by table
    const byTable = {};
    for (const row of result.rows) {
      if (!byTable[row.tablename]) {
        byTable[row.tablename] = [];
      }
      byTable[row.tablename].push(row);
    }

    // Our expected indexes
    const expectedIndexes = [
      'idx_stories_author_id',
      'idx_stories_status',
      'idx_stories_status_created',
      'idx_stories_view_count',
      'idx_stories_author_status',
      'idx_chapters_story_id',
      'idx_chapters_part_id',
      'idx_chapters_story_order',
      'idx_chapters_status_order',
      'idx_parts_story_id',
      'idx_parts_story_order',
      'idx_scenes_chapter_id',
      'idx_scenes_chapter_order',
      'idx_scenes_visibility',
      'idx_scenes_chapter_visibility_order',
      'idx_characters_story_id',
      'idx_ai_interactions_user_id',
      'idx_ai_interactions_created'
    ];

    // Check which indexes exist
    const foundIndexes = [];
    const missingIndexes = [];

    for (const tableName in byTable) {
      console.log(`\n📋 Table: ${tableName}`);
      console.log('─'.repeat(80));

      for (const index of byTable[tableName]) {
        const isExpected = expectedIndexes.includes(index.indexname);
        const symbol = isExpected ? '✅' : '  ';

        console.log(`${symbol} ${index.indexname}`);

        if (isExpected) {
          foundIndexes.push(index.indexname);
        }
      }
    }

    // Find missing indexes
    for (const expectedIndex of expectedIndexes) {
      if (!foundIndexes.includes(expectedIndex)) {
        missingIndexes.push(expectedIndex);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📈 Summary:');
    console.log(`✅ Expected indexes found: ${foundIndexes.length}/${expectedIndexes.length}`);

    if (missingIndexes.length > 0) {
      console.log(`❌ Missing indexes: ${missingIndexes.length}`);
      console.log('\nMissing indexes:');
      for (const missing of missingIndexes) {
        console.log(`  - ${missing}`);
      }
      console.log('\n⚠️  Indexes were NOT properly applied to the database!');
      console.log('💡 Run: dotenv --file .env.local run node scripts/apply-indexes.mjs');
    } else {
      console.log('🎉 All expected indexes are present!');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error verifying indexes:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyIndexes();

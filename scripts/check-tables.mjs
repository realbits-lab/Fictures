import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);

async function checkTables() {
  try {
    const result = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('comments', 'comment_likes', 'story_likes', 'chapter_likes', 'scene_likes')
      ORDER BY table_name
    `;

    console.log('Checking for new tables in database:');
    console.log('----------------------------------------');

    const tableNames = ['comments', 'comment_likes', 'story_likes', 'chapter_likes', 'scene_likes'];
    const existingTables = result.map(r => r.table_name);

    tableNames.forEach(tableName => {
      const exists = existingTables.includes(tableName);
      console.log(`${exists ? '✓' : '✗'} ${tableName}${exists ? '' : ' (missing)'}`);
    });

    console.log('----------------------------------------');
    console.log(`${existingTables.length}/${tableNames.length} tables exist`);
  } catch (error) {
    console.error('Error checking tables:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkTables();

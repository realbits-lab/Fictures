import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);

async function checkCommentsStructure() {
  try {
    const result = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'comments'
      ORDER BY ordinal_position
    `;

    console.log('Comments table structure:');
    console.log('----------------------------------------');
    result.forEach(col => {
      console.log(`${col.column_name} (${col.data_type})${col.is_nullable === 'YES' ? ' NULL' : ' NOT NULL'}`);
    });
    console.log('----------------------------------------');
  } catch (error) {
    console.error('Error checking table structure:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkCommentsStructure();

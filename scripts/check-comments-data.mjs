import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);

async function checkCommentsData() {
  try {
    const result = await client`SELECT COUNT(*) as count FROM comments`;
    console.log(`Comments table has ${result[0].count} rows`);

    if (result[0].count > 0) {
      const sample = await client`SELECT * FROM comments LIMIT 3`;
      console.log('\nSample data:');
      console.log(JSON.stringify(sample, null, 2));
    }
  } catch (error) {
    console.error('Error checking data:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkCommentsData();

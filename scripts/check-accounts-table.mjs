import { db } from '../src/lib/db/index.js';
import { accounts } from '../src/lib/db/schema.js';

try {
  const result = await db.select().from(accounts);
  console.log('Accounts table row count:', result.length);
  console.log('Data:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error checking accounts table:', error);
} finally {
  process.exit(0);
}

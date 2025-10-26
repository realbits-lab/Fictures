import { db } from '../src/lib/db/index.ts';
import { sql } from 'drizzle-orm';

async function verifyReadingHistoryFix() {
  try {
    console.log('Checking reading_history table constraints...\n');

    // Check table constraints
    const constraints = await db.execute(sql`
      SELECT
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'reading_history'
        AND constraint_type IN ('PRIMARY KEY', 'UNIQUE')
      ORDER BY constraint_type, constraint_name
    `);

    console.log('Table constraints:');
    console.table(constraints.rows);

    // Check column details
    const columns = await db.execute(sql`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'reading_history'
      ORDER BY ordinal_position
    `);

    console.log('\nTable columns:');
    console.table(columns.rows);

    console.log('\n✅ Verification complete!');
    console.log('\nExpected constraints:');
    console.log('1. PRIMARY KEY on "id" column');
    console.log('2. UNIQUE constraint "user_story_unique" on (user_id, story_id)');

  } catch (error) {
    console.error('Error verifying table structure:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

verifyReadingHistoryFix();

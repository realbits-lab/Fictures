import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function dropUserTable() {
  try {
    console.log('Dropping unused "User" table...');
    
    // First check if table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      );
    `);
    
    if (tableExists[0].exists) {
      // Drop the table
      await db.execute(sql`DROP TABLE "User" CASCADE;`);
      console.log('✅ Successfully dropped "User" table');
    } else {
      console.log('ℹ️ "User" table does not exist');
    }
    
  } catch (error) {
    console.error('Error dropping User table:', error);
  }
}

dropUserTable().catch(console.error);
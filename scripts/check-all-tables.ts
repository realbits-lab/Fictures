import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function checkTables() {
  try {
    console.log('Checking all tables in the database...');
    
    // Get all table names
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\nAll tables:');
    console.log('===========');
    tablesResult.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    // Check if both users and User tables exist
    const usersTables = tablesResult.filter(row => 
      row.table_name.toLowerCase().includes('user')
    );
    
    console.log('\nUser-related tables:');
    console.log('===================');
    usersTables.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    // Check users table structure and data
    try {
      const usersResult = await db.execute(sql`SELECT * FROM users LIMIT 5;`);
      console.log('\n"users" table data:');
      console.log('==================');
      console.log(usersResult);
    } catch (error) {
      console.log('\n"users" table: Does not exist or error accessing');
    }

    // Check User table structure and data (if exists)
    try {
      const UserResult = await db.execute(sql`SELECT * FROM "User" LIMIT 5;`);
      console.log('\n"User" table data:');
      console.log('=================');
      console.log(UserResult);
    } catch (error) {
      console.log('\n"User" table: Does not exist or error accessing');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables().catch(console.error);
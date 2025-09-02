import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

async function checkUsers() {
  try {
    console.log('Fetching users from database...');
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt
    }).from(users).limit(10);

    console.log('\nUsers in database:');
    console.log('==================');
    
    if (allUsers.length === 0) {
      console.log('No users found in the database.');
    } else {
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name || 'Not set'}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

checkUsers().catch(console.error);
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createUser } from '@/lib/auth/utils';

async function checkAndCreateWriter() {
  try {
    console.log('Checking for writer user...');
    
    // Check if writer user exists
    const existingWriter = await db.select().from(users).where(eq(users.email, 'write@fictures.com'));
    
    if (existingWriter.length > 0) {
      console.log('✅ Writer user already exists:', existingWriter[0]);
    } else {
      console.log('❌ Writer user not found, creating...');
      
      const newWriter = await createUser({
        username: 'writer',
        email: 'write@fictures.com',
        password: 'writer123',
        name: 'Writer User',
        role: 'writer'
      });
      
      console.log('✅ Writer user created:', newWriter);
    }

    // List all users for verification
    console.log('\nAll users in database:');
    console.log('======================');
    const allUsers = await db.select({
      username: users.username,
      email: users.email,
      role: users.role,
      name: users.name
    }).from(users);
    
    allUsers.forEach(user => {
      console.log(`${user.email} (${user.username}) - ${user.role}`);
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndCreateWriter().catch(console.error);
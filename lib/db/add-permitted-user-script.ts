// Simple script to add permitted users - bypasses server-only restriction
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { permittedUser } from './schema';

// Direct database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

async function addPermittedUserDirect(email: string) {
  try {
    const result = await db.insert(permittedUser).values({ 
      email 
    }).returning({
      id: permittedUser.id,
      email: permittedUser.email,
      createdAt: permittedUser.createdAt,
    });
    
    console.log(`✅ Successfully added permitted user: ${email}`);
    console.log('Result:', result[0]);
    
    // Also show all users
    const allUsers = await db.select().from(permittedUser);
    console.log('\n📋 All permitted users:');
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (added: ${user.createdAt})`);
    });
    
  } catch (error) {
    if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
      console.log(`ℹ️ User ${email} already exists in permitted users`);
      
      // Show all users
      const allUsers = await db.select().from(permittedUser);
      console.log('\n📋 All permitted users:');
      allUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (added: ${user.createdAt})`);
      });
    } else {
      console.error('❌ Error adding permitted user:', error);
    }
  } finally {
    await client.end();
  }
}

// Get email from command line args
const email = process.argv[2];

if (!email) {
  console.log('Usage: npx tsx lib/db/add-permitted-user-script.ts <email>');
  console.log('Example: npx tsx lib/db/add-permitted-user-script.ts user@gmail.com');
  process.exit(1);
}

console.log(`🔄 Adding ${email} to permitted users...`);
addPermittedUserDirect(email);
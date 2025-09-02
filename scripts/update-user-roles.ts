import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function updateUserRoles() {
  try {
    console.log('Updating user roles...');

    // Update admin user
    await db.update(users)
      .set({ role: 'admin' })
      .where(eq(users.username, 'admin'));
    console.log('✅ Updated admin role');

    // Update writer user  
    await db.update(users)
      .set({ role: 'writer' })
      .where(eq(users.username, 'writer'));
    console.log('✅ Updated writer role');

    // Update reader user (already defaults to 'reader' but let's be explicit)
    await db.update(users)
      .set({ role: 'reader' })
      .where(eq(users.username, 'reader'));
    console.log('✅ Updated reader role');

    // Check updated users
    console.log('\nUser roles after update:');
    console.log('========================');
    
    const updatedUsers = await db.select({
      username: users.username,
      name: users.name,
      role: users.role,
      email: users.email
    }).from(users);

    updatedUsers.forEach(user => {
      console.log(`${user.username} (${user.name}): ${user.role} - ${user.email}`);
    });

  } catch (error) {
    console.error('Error updating user roles:', error);
  }
}

updateUserRoles().catch(console.error);
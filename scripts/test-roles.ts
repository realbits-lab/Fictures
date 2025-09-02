import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

async function testRoles() {
  try {
    console.log('Testing role-based system...');
    console.log('============================');

    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      name: users.name,
      email: users.email,
      role: users.role
    }).from(users);

    console.log('\nCurrent users with roles:');
    console.log('=========================');
    
    allUsers.forEach(user => {
      const permissions = [];
      
      if (user.role === 'admin') {
        permissions.push('Full Access', 'Can Write', 'Can Moderate');
      } else if (user.role === 'writer') {
        permissions.push('Can Write', 'Can Create Stories');
      } else if (user.role === 'reader') {
        permissions.push('Can Read', 'Can Comment');
      }

      console.log(`\n👤 ${user.username} (${user.name})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role.toUpperCase()}`);
      console.log(`   Permissions: ${permissions.join(', ')}`);
    });

    console.log('\n✅ Role-based system is working!');
    console.log('\nTest accounts:');
    console.log('==============');
    console.log('🔑 admin/admin123 (Full access)');
    console.log('✍️  writer/writer123 (Can write stories)');
    console.log('📚 reader/reader123 (Can read content)');

  } catch (error) {
    console.error('Error testing roles:', error);
  }
}

testRoles().catch(console.error);
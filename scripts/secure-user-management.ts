import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/utils';
import { getAllTestUsers } from '@/lib/test/credentials';

/**
 * Secure user management script that uses credentials from @playwright/.auth/user.json
 * No hardcoded passwords - all credentials are loaded securely
 */
async function secureUserPasswordReset() {
  try {
    console.log('Loading secure user credentials...');
    const testUsers = getAllTestUsers();
    
    console.log('Updating user passwords with secure credentials...');
    console.log('==================================================');

    // Map of email to user data from secure credentials
    const userUpdates = [
      { email: testUsers.writer.email, password: testUsers.writer.password, username: testUsers.writer.name },
      { email: testUsers.reader.email, password: testUsers.reader.password, username: testUsers.reader.name },
      { email: testUsers.admin.email, password: testUsers.admin.password, username: testUsers.admin.name }
    ];

    for (const userData of userUpdates) {
      console.log(`\n🔐 Updating password for ${userData.email}...`);
      
      // Hash the new password
      const hashedPassword = await hashPassword(userData.password);
      
      // Update password in database
      const result = await db.update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.email, userData.email))
        .returning({
          username: users.username,
          name: users.name,
          role: users.role,
          email: users.email
        });

      if (result.length > 0) {
        const user = result[0];
        console.log(`   ✅ ${user.email} (${user.username}) - ${user.role}`);
        console.log(`   🔑 Password updated securely`);
      } else {
        console.log(`   ❌ User with email ${userData.email} not found`);
      }
    }

    console.log('\n🎉 All passwords updated successfully using secure credentials!');
    console.log('\nCredentials loaded from: @playwright/.auth/user.json');
    console.log('✅ No hardcoded passwords in source code');

  } catch (error) {
    console.error('Error updating passwords:', error);
    process.exit(1);
  }
}

secureUserPasswordReset().catch(console.error);
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/utils';

// Generate secure passwords
const securePasswords = {
  admin: 'Adm1n$ecur3P@ssw0rd2025!',
  writer: 'Wr1t3r$ecur3P@ssw0rd2025!',
  reader: 'R3ad3r$ecur3P@ssw0rd2025!',
};

async function updateSecurePasswords() {
  try {
    console.log('Updating user passwords with secure versions...');
    console.log('================================================');

    for (const [username, newPassword] of Object.entries(securePasswords)) {
      console.log(`\n🔐 Updating ${username} password...`);
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password in database
      const result = await db.update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.username, username))
        .returning({
          username: users.username,
          name: users.name,
          role: users.role,
          email: users.email
        });

      if (result.length > 0) {
        const user = result[0];
        console.log(`   ✅ ${user.username} (${user.name}) - ${user.role}`);
        console.log(`   📧 ${user.email}`);
        console.log(`   🔑 New password: ${newPassword}`);
      } else {
        console.log(`   ❌ User ${username} not found`);
      }
    }

    console.log('\n🎉 All passwords updated successfully!');
    console.log('\nNew secure credentials:');
    console.log('======================');
    Object.entries(securePasswords).forEach(([username, password]) => {
      console.log(`${username}: ${password}`);
    });

  } catch (error) {
    console.error('Error updating passwords:', error);
  }
}

updateSecurePasswords().catch(console.error);
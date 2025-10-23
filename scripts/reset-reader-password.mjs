import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL is not set in environment variables');
  process.exit(1);
}

const client = postgres(connectionString);

async function resetPassword() {
  try {
    // Get the new password from command line argument
    const newPassword = process.argv[2];

    if (!newPassword) {
      console.error('❌ Please provide a new password as argument');
      console.log('Usage: node scripts/reset-reader-password.mjs <new-password>');
      process.exit(1);
    }

    console.log('Resetting password for reader@fictures.xyz...\n');

    // Check if user exists
    const result = await client`
      SELECT id, email
      FROM users
      WHERE email = 'reader@fictures.xyz'
      LIMIT 1
    `;

    if (result.length === 0) {
      console.log('❌ User "reader@fictures.xyz" not found');
      process.exit(1);
    }

    const user = result[0];
    console.log('✅ User found:', user.email);
    console.log('User ID:', user.id);

    // Hash the new password
    console.log('\nHashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✅ Password hashed');

    // Update the password in database
    console.log('\nUpdating password in database...');
    await client`
      UPDATE users
      SET password = ${hashedPassword}
      WHERE email = 'reader@fictures.xyz'
    `;

    console.log('✅ Password updated successfully!\n');

    // Verify the new password
    console.log('Verifying new password...');
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log('Verification result:', isValid ? '✅ VALID' : '❌ INVALID');

    if (isValid) {
      console.log('\n🎉 Password reset complete!');
      console.log('You can now login with:');
      console.log('   Email: reader@fictures.xyz');
      console.log('   Password: <the password you just set>');
    }
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetPassword();

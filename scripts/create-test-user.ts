import { createUser } from '@/lib/auth/utils';

async function main() {
  console.log('Creating test user...');
  
  try {
    const user = await createUser({
      username: 'admin',
      email: 'admin@fictures.com',
      password: 'admin123',
      name: 'Admin User',
    });

    console.log('Test user created successfully:', {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error('Failed to create test user:', error);
  }
}

main().catch(console.error);
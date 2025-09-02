import { createUser } from '@/lib/auth/utils';

async function createSampleUsers() {
  console.log('Creating sample users...');
  
  try {
    // Create reader user
    const readerUser = await createUser({
      username: 'reader',
      email: 'reader@fictures.com',
      password: 'reader123',
      name: 'Jane Reader',
    });

    console.log('✅ Reader user created:', {
      id: readerUser.id,
      username: readerUser.username,
      email: readerUser.email,
      name: readerUser.name,
    });

    // Create writer user
    const writerUser = await createUser({
      username: 'writer',
      email: 'writer@fictures.com', 
      password: 'writer123',
      name: 'John Writer',
    });

    console.log('✅ Writer user created:', {
      id: writerUser.id,
      username: writerUser.username,
      email: writerUser.email,
      name: writerUser.name,
    });

    console.log('\n🎉 Sample users created successfully!');
    console.log('\nTest credentials:');
    console.log('================');
    console.log('Admin: admin / admin123');
    console.log('Reader: reader / reader123');
    console.log('Writer: writer / writer123');

  } catch (error) {
    console.error('Failed to create sample users:', error);
  }
}

createSampleUsers().catch(console.error);
#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('Environment check:');
console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'Set (length: ' + process.env.POSTGRES_URL.length + ')' : 'Not set');

// Parse the URL
if (process.env.POSTGRES_URL) {
  const url = new URL(process.env.POSTGRES_URL);
  console.log('Host:', url.hostname);
  console.log('Port:', url.port || '5432');
  console.log('Database:', url.pathname.substring(1));
  console.log('SSL mode:', url.searchParams.get('sslmode'));
}

// Now try to connect
import postgres from 'postgres';

if (process.env.POSTGRES_URL) {
  console.log('\nAttempting connection...');
  try {
    const client = postgres(process.env.POSTGRES_URL, { prepare: false });

    const result = await client`SELECT 1 as test`;
    console.log('✅ Connection successful!');
    console.log('Test query result:', result);

    // Check for stories
    const stories = await client`SELECT COUNT(*) as count FROM stories`;
    console.log(`Found ${stories[0].count} stories in database`);

    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}
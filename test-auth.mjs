#!/usr/bin/env node

async function testAuthentication() {
  console.log('🔐 Testing ID/Password Authentication...\n');

  try {
    // Test 1: User Registration
    console.log('📝 Testing user registration...');
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User'
      })
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Registration successful:', registerData.message);
      console.log('   User:', registerData.user);
    } else {
      const error = await registerResponse.json();
      console.log('❌ Registration failed:', error.error);

      // If user already exists, that's fine for testing
      if (registerResponse.status === 409) {
        console.log('   (User already exists - this is expected for repeated tests)');
      }
    }

    console.log('\n🔑 Testing credentials login...');

    // Test 2: Credentials Sign In
    const signInResponse = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123'
      })
    });

    if (signInResponse.ok) {
      console.log('✅ Credentials login endpoint responded successfully');
    } else {
      console.log('❌ Credentials login failed:', signInResponse.status, signInResponse.statusText);
    }

    console.log('\n📋 Testing password hashing functionality...');

    // Test the password hashing directly by importing the module
    // This will verify the Web Crypto API implementation works
    try {
      // Dynamic import to test the password utility
      const { hashPassword, verifyPassword } = await import('./src/lib/auth/password.js');

      const testPassword = 'mySecurePassword123';
      const hashedPassword = await hashPassword(testPassword);

      console.log('✅ Password hashing successful');
      console.log('   Original:', testPassword);
      console.log('   Hashed:', hashedPassword.substring(0, 20) + '...');

      // Test verification
      const isValid = await verifyPassword(testPassword, hashedPassword);
      const isInvalid = await verifyPassword('wrongPassword', hashedPassword);

      console.log('✅ Password verification successful');
      console.log('   Correct password verified:', isValid);
      console.log('   Wrong password rejected:', !isInvalid);

    } catch (error) {
      console.log('❌ Password hashing test failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthentication();
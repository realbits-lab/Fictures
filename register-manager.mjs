#!/usr/bin/env node

// Complex password generation and manager user registration

function generateComplexPassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // Ensure at least one character from each category
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining characters (total length: 24)
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 4; i < 24; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function registerManager() {
  const complexPassword = generateComplexPassword();

  console.log('🔐 Registering Manager User...\n');
  console.log('Email: manager@fictures.xyz');
  console.log('Password:', complexPassword);
  console.log('Password Length:', complexPassword.length);
  console.log('');

  try {
    // Step 1: Register the user
    console.log('📝 Step 1: Registering user...');
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'manager@fictures.xyz',
        password: complexPassword,
        name: 'Fictures Manager'
      })
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ User registration successful');
      console.log('   User ID:', registerData.user.id);
      console.log('   Email:', registerData.user.email);
      console.log('   Name:', registerData.user.name);

      // Step 2: Update role to manager
      console.log('\n📊 Step 2: Updating user role to manager...');

      const roleUpdateResponse = await fetch(`http://localhost:3000/api/users/${registerData.user.id}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'manager@fictures.xyz',
          role: 'manager'
        })
      });

      if (roleUpdateResponse.ok) {
        const roleData = await roleUpdateResponse.json();
        console.log('✅ Role updated successfully');
        console.log('   Role:', roleData.user.role);
      } else {
        const roleError = await roleUpdateResponse.json();
        console.log('❌ Role update failed:', roleError.error);
      }

      console.log('✅ Manager user created successfully');
      console.log('\n🔑 IMPORTANT - Save these credentials:');
      console.log('==========================================');
      console.log('Email: manager@fictures.xyz');
      console.log('Password:', complexPassword);
      console.log('Role: manager');
      console.log('==========================================');

    } else {
      const error = await registerResponse.json();
      if (registerResponse.status === 409) {
        console.log('⚠️  User already exists. Skipping registration.');
        console.log('   Using existing manager@fictures.xyz account');
      } else {
        console.log('❌ Registration failed:', error.error);
        return;
      }
    }

  } catch (error) {
    console.error('❌ Registration failed:', error.message);
  }
}

registerManager();
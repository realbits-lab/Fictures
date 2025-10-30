#!/usr/bin/env node

/**
 * Check current user session and permissions
 */

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function checkSession() {
  try {
    console.log('Checking session at:', API_URL);

    const response = await fetch(`${API_URL}/api/auth/session`, {
      headers: {
        'Cookie': 'next-auth.session-token=your-session-token-here'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch session:', response.status);
      return;
    }

    const session = await response.json();
    console.log('\nCurrent Session:');
    console.log('- User:', session?.user?.name || 'Not logged in');
    console.log('- Email:', session?.user?.email || 'N/A');
    console.log('- Role:', session?.user?.role || 'N/A');
    console.log('- User ID:', session?.user?.id || 'N/A');

    console.log('\nPermissions:');
    console.log('- Can access Studio:', ['writer', 'manager'].includes(session?.user?.role));
    console.log('- Can access Research:', ['writer', 'manager'].includes(session?.user?.role));
    console.log('- Can access Publish:', ['writer', 'manager'].includes(session?.user?.role));
    console.log('- Can access Analytics:', ['writer', 'manager'].includes(session?.user?.role));

  } catch (error) {
    console.error('Error checking session:', error.message);
  }
}

checkSession();

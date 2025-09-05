import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

// GET /api/settings/user - Get user's account settings
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return user settings based on session data
    // For now, we'll use the session data and provide default values
    const userSettings = {
      displayName: session.user.name || '',
      email: session.user.email || '',
      bio: '', // Default empty bio
      profileImage: session.user.image || null,
      accountType: session.user.role || 'user',
      memberSince: new Date().toISOString(), // Default to now, should be from database
      preferences: {
        emailNotifications: true,
        pushNotifications: false,
        marketingEmails: false
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showStats: true
      }
    };

    return NextResponse.json(userSettings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/settings/user - Update user's account settings
export async function PUT(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // For now, we'll just return the updated data
    // In a real implementation, this would save to the database
    const updatedSettings = {
      displayName: body.displayName || session.user.name,
      email: session.user.email, // Email can't be changed via OAuth
      bio: body.bio || '',
      profileImage: session.user.image,
      accountType: session.user.role || 'user',
      memberSince: new Date().toISOString(),
      preferences: {
        emailNotifications: body.preferences?.emailNotifications ?? true,
        pushNotifications: body.preferences?.pushNotifications ?? false,
        marketingEmails: body.preferences?.marketingEmails ?? false
      },
      privacy: {
        profileVisibility: body.privacy?.profileVisibility || 'public',
        showEmail: body.privacy?.showEmail ?? false,
        showStats: body.privacy?.showStats ?? true
      }
    };

    console.log('User settings updated for:', session.user.email);
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
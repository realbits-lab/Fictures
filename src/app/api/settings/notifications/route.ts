import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

// GET /api/settings/notifications - Get user's notification settings
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return default notification settings
    const notificationSettings = {
      email: {
        newComments: true,
        newFollowers: true,
        storyUpdates: false,
        weeklyDigest: true,
        marketingEmails: false,
        systemUpdates: true
      },
      push: {
        enabled: false,
        newComments: false,
        newFollowers: false,
        storyUpdates: false,
        mentions: false
      },
      inApp: {
        enabled: true,
        newComments: true,
        newFollowers: true,
        storyUpdates: true,
        mentions: true,
        systemNotices: true
      },
      frequency: {
        immediate: true,
        daily: false,
        weekly: false
      }
    };

    return NextResponse.json(notificationSettings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/settings/notifications - Update user's notification settings
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
      email: {
        newComments: body.email?.newComments ?? true,
        newFollowers: body.email?.newFollowers ?? true,
        storyUpdates: body.email?.storyUpdates ?? false,
        weeklyDigest: body.email?.weeklyDigest ?? true,
        marketingEmails: body.email?.marketingEmails ?? false,
        systemUpdates: body.email?.systemUpdates ?? true
      },
      push: {
        enabled: body.push?.enabled ?? false,
        newComments: body.push?.newComments ?? false,
        newFollowers: body.push?.newFollowers ?? false,
        storyUpdates: body.push?.storyUpdates ?? false,
        mentions: body.push?.mentions ?? false
      },
      inApp: {
        enabled: body.inApp?.enabled ?? true,
        newComments: body.inApp?.newComments ?? true,
        newFollowers: body.inApp?.newFollowers ?? true,
        storyUpdates: body.inApp?.storyUpdates ?? true,
        mentions: body.inApp?.mentions ?? true,
        systemNotices: body.inApp?.systemNotices ?? true
      },
      frequency: {
        immediate: body.frequency?.immediate ?? true,
        daily: body.frequency?.daily ?? false,
        weekly: body.frequency?.weekly ?? false
      }
    };

    console.log('Notification settings updated for:', session.user.email);
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
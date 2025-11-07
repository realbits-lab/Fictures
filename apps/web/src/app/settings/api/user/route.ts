import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

// GET /api/settings/user - Get user's account settings
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user preferences from database
    const [userPrefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    // Create default preferences if none exist
    let preferences = userPrefs;
    if (!preferences) {
      [preferences] = await db
        .insert(userPreferences)
        .values({
          id: nanoid(),
          userId: session.user.id,
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: false,
          marketingEmails: false,
          profileVisibility: 'public',
          showEmail: false,
          showStats: true,
        })
        .returning();
    }

    const userSettings = {
      displayName: session.user.name || '',
      email: session.user.email || '',
      bio: '', // Default empty bio
      profileImage: session.user.image || null,
      accountType: session.user.role || 'user',
      memberSince: new Date().toISOString(), // Default to now, should be from database
      preferences: {
        theme: preferences.theme,
        language: preferences.language,
        timezone: preferences.timezone,
        emailNotifications: preferences.emailNotifications,
        pushNotifications: preferences.pushNotifications,
        marketingEmails: preferences.marketingEmails,
      },
      privacy: {
        profileVisibility: preferences.profileVisibility,
        showEmail: preferences.showEmail,
        showStats: preferences.showStats,
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

    // Fetch existing preferences
    const [existingPrefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    // Update or create preferences in database
    let updatedPrefs;
    if (existingPrefs) {
      [updatedPrefs] = await db
        .update(userPreferences)
        .set({
          theme: body.preferences?.theme || existingPrefs.theme,
          language: body.preferences?.language || existingPrefs.language,
          timezone: body.preferences?.timezone || existingPrefs.timezone,
          emailNotifications: body.preferences?.emailNotifications ?? existingPrefs.emailNotifications,
          pushNotifications: body.preferences?.pushNotifications ?? existingPrefs.pushNotifications,
          marketingEmails: body.preferences?.marketingEmails ?? existingPrefs.marketingEmails,
          profileVisibility: body.privacy?.profileVisibility || existingPrefs.profileVisibility,
          showEmail: body.privacy?.showEmail ?? existingPrefs.showEmail,
          showStats: body.privacy?.showStats ?? existingPrefs.showStats,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userPreferences.userId, session.user.id))
        .returning();
    } else {
      [updatedPrefs] = await db
        .insert(userPreferences)
        .values({
          id: nanoid(),
          userId: session.user.id,
          theme: body.preferences?.theme || 'system',
          language: body.preferences?.language || 'en',
          timezone: body.preferences?.timezone || 'UTC',
          emailNotifications: body.preferences?.emailNotifications ?? true,
          pushNotifications: body.preferences?.pushNotifications ?? false,
          marketingEmails: body.preferences?.marketingEmails ?? false,
          profileVisibility: body.privacy?.profileVisibility || 'public',
          showEmail: body.privacy?.showEmail ?? false,
          showStats: body.privacy?.showStats ?? true,
        })
        .returning();
    }

    const updatedSettings = {
      displayName: body.displayName || session.user.name,
      email: session.user.email, // Email can't be changed via OAuth
      bio: body.bio || '',
      profileImage: session.user.image,
      accountType: session.user.role || 'user',
      memberSince: new Date().toISOString(),
      preferences: {
        theme: updatedPrefs.theme,
        language: updatedPrefs.language,
        timezone: updatedPrefs.timezone,
        emailNotifications: updatedPrefs.emailNotifications,
        pushNotifications: updatedPrefs.pushNotifications,
        marketingEmails: updatedPrefs.marketingEmails,
      },
      privacy: {
        profileVisibility: updatedPrefs.profileVisibility,
        showEmail: updatedPrefs.showEmail,
        showStats: updatedPrefs.showStats,
      }
    };

    console.log('User settings updated for:', session.user.email, 'Theme:', updatedPrefs.theme);

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
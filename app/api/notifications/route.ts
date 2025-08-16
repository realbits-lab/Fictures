import { auth } from '@/app/auth';
import { db } from '@/lib/db';
import { notification } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread') === 'true';
    const offset = (page - 1) * limit;

    const conditions = [eq(notification.userId, session.user.id!)];

    if (unreadOnly) {
      conditions.push(eq(notification.isRead, false));
    }

    const notifications = await db
      .select()
      .from(notification)
      .where(and(...conditions))
      .orderBy(desc(notification.createdAt))
      .limit(limit)
      .offset(offset);

    // Get unread count
    const unreadCount = await db
      .select({ count: notification.id })
      .from(notification)
      .where(
        and(
          eq(notification.userId, session.user.id!),
          eq(notification.isRead, false)
        )
      );

    return NextResponse.json({
      notifications,
      unreadCount: unreadCount.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
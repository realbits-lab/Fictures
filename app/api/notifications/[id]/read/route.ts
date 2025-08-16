import { auth } from '@/app/auth';
import { db } from '@/lib/db';
import { notification } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const [updatedNotification] = await db
      .update(notification)
      .set({ isRead: true })
      .where(
        and(
          eq(notification.id, id),
          eq(notification.userId, session.user.id!)
        )
      )
      .returning();

    if (!updatedNotification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
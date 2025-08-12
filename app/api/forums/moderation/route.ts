import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { forumModeration } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For demo purposes, we'll allow any authenticated user to moderate
    // In a real app, you'd check moderator permissions
    const body = await request.json();
    const { targetType, targetId, action, reason, duration } = body;

    if (!targetType || !targetId || !action || !reason) {
      return NextResponse.json(
        { error: 'Target type, ID, action, and reason are required' },
        { status: 400 }
      );
    }

    const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000) : null;

    const [moderation] = await db
      .insert(forumModeration)
      .values({
        targetType,
        targetId,
        moderatorId: session.user.id!,
        action,
        reason,
        duration,
        expiresAt,
      })
      .returning();

    return NextResponse.json(moderation, { status: 201 });
  } catch (error) {
    console.error('Error creating moderation action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { groupActivity, user } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const activities = await db
      .select({
        id: groupActivity.id,
        activityType: groupActivity.activityType,
        content: groupActivity.content,
        metadata: groupActivity.metadata,
        createdAt: groupActivity.createdAt,
        userName: user.name,
      })
      .from(groupActivity)
      .leftJoin(user, eq(groupActivity.userId, user.id))
      .where(eq(groupActivity.groupId, params.id))
      .orderBy(desc(groupActivity.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching group activities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { activityType, content, metadata } = body;

    if (!activityType || !content) {
      return NextResponse.json(
        { error: 'Activity type and content are required' },
        { status: 400 }
      );
    }

    const [activity] = await db
      .insert(groupActivity)
      .values({
        groupId: params.id,
        userId: session.user.id!,
        activityType,
        content,
        metadata,
      })
      .returning();

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error creating group activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
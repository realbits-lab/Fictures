import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { group, groupActivity } from '@/lib/db/schema';
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

    const [groupData] = await db
      .select()
      .from(group)
      .where(eq(group.id, params.id));

    if (!groupData) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get recent activity
    const recentActivity = await db
      .select()
      .from(groupActivity)
      .where(eq(groupActivity.groupId, params.id))
      .orderBy(desc(groupActivity.createdAt))
      .limit(5);

    return NextResponse.json({
      ...groupData,
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
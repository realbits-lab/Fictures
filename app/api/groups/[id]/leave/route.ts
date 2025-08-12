import { auth } from '@/app/auth';
import { db } from '@/lib/db';
import { group, groupMember, groupActivity } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a member
    const [existingMember] = await db
      .select()
      .from(groupMember)
      .where(
        and(
          eq(groupMember.groupId, params.id),
          eq(groupMember.userId, session.user.id!)
        )
      );

    if (!existingMember) {
      return NextResponse.json({ error: 'Not a member' }, { status: 400 });
    }

    if (existingMember.role === 'owner') {
      return NextResponse.json({ error: 'Owner cannot leave group' }, { status: 400 });
    }

    // Remove member
    await db
      .delete(groupMember)
      .where(
        and(
          eq(groupMember.groupId, params.id),
          eq(groupMember.userId, session.user.id!)
        )
      );

    // Update member count
    const [groupData] = await db
      .select()
      .from(group)
      .where(eq(group.id, params.id));

    if (groupData) {
      await db
        .update(group)
        .set({ memberCount: Math.max(0, groupData.memberCount - 1) })
        .where(eq(group.id, params.id));

      // Create activity
      await db.insert(groupActivity).values({
        groupId: params.id,
        userId: session.user.id!,
        activityType: 'leave',
        content: `${session.user.name} left the group`,
      });
    }

    return NextResponse.json({ left: true });
  } catch (error) {
    console.error('Error leaving group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
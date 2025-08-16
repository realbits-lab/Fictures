import { auth } from '@/app/auth';
import { db } from '@/lib/db';
import { group, groupMember, groupActivity } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    // Check if group exists
    const [groupData] = await db
      .select()
      .from(group)
      .where(eq(group.id, id));

    if (!groupData) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is already a member
    const [existingMember] = await db
      .select()
      .from(groupMember)
      .where(
        and(
          eq(groupMember.groupId, id),
          eq(groupMember.userId, session.user.id!)
        )
      );

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member' }, { status: 400 });
    }

    // Check member limit
    if (groupData.memberLimit && groupData.memberCount >= groupData.memberLimit) {
      return NextResponse.json({ error: 'Group is full' }, { status: 400 });
    }

    // Add member
    await db.insert(groupMember).values({
      groupId: id,
      userId: session.user.id!,
      role: 'member',
    });

    // Update member count
    await db
      .update(group)
      .set({ memberCount: groupData.memberCount + 1 })
      .where(eq(group.id, id));

    // Create activity
    await db.insert(groupActivity).values({
      groupId: id,
      userId: session.user.id!,
      activityType: 'join',
      content: `${session.user.name} joined the group`,
    });

    return NextResponse.json({ joined: true });
  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
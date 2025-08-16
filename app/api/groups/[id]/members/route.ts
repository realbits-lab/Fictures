import { auth } from '@/app/auth';
import { db } from '@/lib/db';
import { groupMember, user } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const members = await db
      .select({
        userId: groupMember.userId,
        role: groupMember.role,
        joinedAt: groupMember.joinedAt,
        name: user.name,
        email: user.email,
      })
      .from(groupMember)
      .leftJoin(user, eq(groupMember.userId, user.id))
      .where(eq(groupMember.groupId, id))
      .limit(limit)
      .offset(offset);

    const totalMembers = await db
      .select({ count: groupMember.userId })
      .from(groupMember)
      .where(eq(groupMember.groupId, id));

    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        total: totalMembers.length,
        totalPages: Math.ceil(totalMembers.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching group members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { auth } from '@/app/auth';
import { db } from '@/lib/db';
import { userLevel } from '@/lib/db/schema';
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
    const [level] = await db
      .select()
      .from(userLevel)
      .where(eq(userLevel.userId, id));

    if (!level) {
      // Create default level if doesn't exist
      const [newLevel] = await db
        .insert(userLevel)
        .values({
          userId: id,
          level: 1,
          experience: 0,
          nextLevelExp: 100,
          totalExp: 0,
          title: 'Newcomer',
        })
        .returning();

      return NextResponse.json(newLevel);
    }

    return NextResponse.json(level);
  } catch (error) {
    console.error('Error fetching user level:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
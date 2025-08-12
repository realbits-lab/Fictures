import { auth } from '@/app/auth';
import { db } from '@/lib/db';
import { leaderboard, user } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'weekly';
    const category = searchParams.get('category') || 'reading';
    const limit = parseInt(searchParams.get('limit') || '10');

    const leaderboardData = await db
      .select({
        rank: leaderboard.rank,
        score: leaderboard.score,
        userId: leaderboard.userId,
        userName: user.name,
      })
      .from(leaderboard)
      .leftJoin(user, eq(leaderboard.userId, user.id))
      .where(
        and(
          eq(leaderboard.type, type as any),
          eq(leaderboard.category, category as any)
        )
      )
      .orderBy(leaderboard.rank)
      .limit(limit);

    return NextResponse.json(leaderboardData);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
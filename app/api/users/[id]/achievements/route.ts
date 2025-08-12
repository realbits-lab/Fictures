import { auth } from '@/app/auth';
import { db } from '@/lib/db';
import { userAchievement, achievement } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const unlocked = await db
      .select({
        achievement: achievement,
        unlockedAt: userAchievement.unlockedAt,
        isDisplayed: userAchievement.isDisplayed,
      })
      .from(userAchievement)
      .leftJoin(achievement, eq(userAchievement.achievementId, achievement.id))
      .where(eq(userAchievement.userId, params.id))
      .where(eq(userAchievement.isUnlocked, true));

    const inProgress = await db
      .select({
        achievement: achievement,
        progress: userAchievement.progress,
        maxProgress: userAchievement.maxProgress,
      })
      .from(userAchievement)
      .leftJoin(achievement, eq(userAchievement.achievementId, achievement.id))
      .where(eq(userAchievement.userId, params.id))
      .where(eq(userAchievement.isUnlocked, false));

    return NextResponse.json({
      unlocked,
      inProgress,
    });
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
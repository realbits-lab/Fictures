import { auth } from '@/app/auth';
import { db } from '@/lib/db/index';
import { achievement } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const rarity = searchParams.get('rarity');

    const conditions = [eq(achievement.isSecret, false)];

    if (category && category !== 'all') {
      conditions.push(eq(achievement.category, category));
    }
    if (rarity && rarity !== 'all') {
      conditions.push(eq(achievement.rarity, rarity as any));
    }

    const achievements = await db
      .select()
      .from(achievement)
      .where(and(...conditions));

    return NextResponse.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
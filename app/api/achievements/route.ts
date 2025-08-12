import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { achievement } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const rarity = searchParams.get('rarity');

    let query = db.select().from(achievement);

    if (category && category !== 'all') {
      query = query.where(eq(achievement.category, category));
    }
    if (rarity && rarity !== 'all') {
      query = query.where(eq(achievement.rarity, rarity as any));
    }

    // Don't show secret achievements unless unlocked
    query = query.where(eq(achievement.isSecret, false));

    const achievements = await query;

    return NextResponse.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
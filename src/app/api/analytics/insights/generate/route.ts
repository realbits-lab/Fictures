import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateStoryInsights } from '@/lib/services/insights';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { storyId, includeTypes } = await request.json();

    if (!storyId) {
      return NextResponse.json(
        { error: 'storyId required' },
        { status: 400 }
      );
    }

    const [story] = await db
      .select()
      .from(stories)
      .where(
        and(
          eq(stories.id, storyId),
          eq(stories.authorId, session.user.id)
        )
      )
      .limit(1);

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    await generateStoryInsights({ storyId, includeTypes });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to generate insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

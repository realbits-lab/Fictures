import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { readingHistory } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// GET /reading/api/history - Fetch user's reading history
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch reading history sorted by most recently read
    const history = await db
      .select()
      .from(readingHistory)
      .where(eq(readingHistory.userId, session.user.id))
      .orderBy(desc(readingHistory.lastReadAt));

    return NextResponse.json({
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Error fetching reading history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reading history' },
      { status: 500 }
    );
  }
}

// POST /reading/api/history - Record a story view
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { storyId } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      );
    }

    // Check if history entry exists
    const existing = await db
      .select()
      .from(readingHistory)
      .where(
        and(
          eq(readingHistory.userId, session.user.id),
          eq(readingHistory.storyId, storyId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing entry
      await db
        .update(readingHistory)
        .set({
          lastReadAt: new Date(),
          readCount: existing[0].readCount + 1,
        })
        .where(
          and(
            eq(readingHistory.userId, session.user.id),
            eq(readingHistory.storyId, storyId)
          )
        );

      return NextResponse.json({
        message: 'Reading history updated',
        readCount: existing[0].readCount + 1
      });
    } else {
      // Create new entry
      await db.insert(readingHistory).values({
        id: nanoid(),
        userId: session.user.id,
        storyId,
        lastReadAt: new Date(),
        readCount: 1,
        createdAt: new Date(),
      });

      return NextResponse.json({
        message: 'Reading history created',
        readCount: 1
      });
    }
  } catch (error) {
    console.error('Error recording reading history:', error);
    return NextResponse.json(
      { error: 'Failed to record reading history' },
      { status: 500 }
    );
  }
}

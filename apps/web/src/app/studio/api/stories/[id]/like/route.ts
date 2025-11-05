import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stories, storyLikes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

// POST /api/stories/[id]/like - Toggle like on a story
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storyId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if story exists
    const [story] = await db
      .select()
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Check if user has already liked this story
    const [existingLike] = await db
      .select()
      .from(storyLikes)
      .where(
        and(
          eq(storyLikes.storyId, storyId),
          eq(storyLikes.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingLike) {
      // Unlike: Remove the like
      await db
        .delete(storyLikes)
        .where(
          and(
            eq(storyLikes.storyId, storyId),
            eq(storyLikes.userId, session.user.id)
          )
        );

      return NextResponse.json({
        liked: false,
        message: 'Story unliked',
      });
    } else {
      // Like: Add a like
      await db
        .insert(storyLikes)
        .values({
          storyId,
          userId: session.user.id,
          createdAt: new Date(),
        });

      return NextResponse.json({
        liked: true,
        message: 'Story liked',
      });
    }
  } catch (error) {
    console.error('Error toggling story like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}

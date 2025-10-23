import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { chapters, chapterLikes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

// POST /api/chapters/[chapterId]/like - Toggle like on a chapter
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if chapter exists
    const [chapter] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1);

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Check if user has already liked this chapter
    const [existingLike] = await db
      .select()
      .from(chapterLikes)
      .where(
        and(
          eq(chapterLikes.chapterId, chapterId),
          eq(chapterLikes.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingLike) {
      // Unlike: Remove the like
      await db
        .delete(chapterLikes)
        .where(eq(chapterLikes.id, existingLike.id));

      return NextResponse.json({
        liked: false,
        message: 'Chapter unliked',
      });
    } else {
      // Like: Add a like
      await db
        .insert(chapterLikes)
        .values({
          id: nanoid(),
          chapterId,
          userId: session.user.id,
          createdAt: new Date(),
        });

      return NextResponse.json({
        liked: true,
        message: 'Chapter liked',
      });
    }
  } catch (error) {
    console.error('Error toggling chapter like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}

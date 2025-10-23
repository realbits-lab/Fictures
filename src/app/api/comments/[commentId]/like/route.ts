import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { comments, commentLikes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

// POST /api/comments/[commentId]/like - Toggle like on a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if comment exists
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user has already liked this comment
    const [existingLike] = await db
      .select()
      .from(commentLikes)
      .where(
        and(
          eq(commentLikes.commentId, commentId),
          eq(commentLikes.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingLike) {
      // Unlike: Remove the like
      await db
        .delete(commentLikes)
        .where(eq(commentLikes.id, existingLike.id));

      // Decrement like count
      await db
        .update(comments)
        .set({
          likeCount: Math.max(0, comment.likeCount - 1),
          updatedAt: new Date(),
        })
        .where(eq(comments.id, commentId));

      return NextResponse.json({
        liked: false,
        likeCount: Math.max(0, comment.likeCount - 1),
      });
    } else {
      // Like: Add a like
      await db
        .insert(commentLikes)
        .values({
          id: nanoid(),
          commentId,
          userId: session.user.id,
          createdAt: new Date(),
        });

      // Increment like count
      await db
        .update(comments)
        .set({
          likeCount: comment.likeCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(comments.id, commentId));

      return NextResponse.json({
        liked: true,
        likeCount: comment.likeCount + 1,
      });
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}

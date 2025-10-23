import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { comments, commentDislikes, commentLikes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

// POST /api/comments/[commentId]/dislike - Toggle dislike on a comment
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

    // Check if user has already disliked this comment
    const [existingDislike] = await db
      .select()
      .from(commentDislikes)
      .where(
        and(
          eq(commentDislikes.commentId, commentId),
          eq(commentDislikes.userId, session.user.id)
        )
      )
      .limit(1);

    // Check if user has liked this comment (remove like if disliking)
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

    if (existingDislike) {
      // Remove dislike
      await db
        .delete(commentDislikes)
        .where(eq(commentDislikes.id, existingDislike.id));

      // Decrement dislike count
      await db
        .update(comments)
        .set({
          dislikeCount: Math.max(0, comment.dislikeCount - 1),
          updatedAt: new Date(),
        })
        .where(eq(comments.id, commentId));

      return NextResponse.json({
        liked: !!existingLike,
        disliked: false,
        likeCount: comment.likeCount,
        dislikeCount: Math.max(0, comment.dislikeCount - 1),
      });
    } else {
      // Add dislike and remove like if exists
      if (existingLike) {
        await db
          .delete(commentLikes)
          .where(eq(commentLikes.id, existingLike.id));

        await db
          .update(comments)
          .set({
            likeCount: Math.max(0, comment.likeCount - 1),
          })
          .where(eq(comments.id, commentId));
      }

      // Add dislike
      await db
        .insert(commentDislikes)
        .values({
          id: nanoid(),
          commentId,
          userId: session.user.id,
          createdAt: new Date(),
        });

      // Increment dislike count
      await db
        .update(comments)
        .set({
          dislikeCount: comment.dislikeCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(comments.id, commentId));

      return NextResponse.json({
        liked: false,
        disliked: true,
        likeCount: existingLike ? Math.max(0, comment.likeCount - 1) : comment.likeCount,
        dislikeCount: comment.dislikeCount + 1,
      });
    }
  } catch (error) {
    console.error('Error toggling comment dislike:', error);
    return NextResponse.json(
      { error: 'Failed to toggle dislike' },
      { status: 500 }
    );
  }
}

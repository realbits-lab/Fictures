import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { comments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const runtime = 'nodejs';

const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

// PATCH /api/comments/[commentId] - Update a comment
export async function PATCH(
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

    const body = await request.json();
    const validatedData = updateCommentSchema.parse(body);

    // Check if comment exists and belongs to user
    const [existingComment] = await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.id, commentId),
          eq(comments.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update the comment
    const [updatedComment] = await db
      .update(comments)
      .set({
        content: validatedData.content,
        isEdited: true,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, commentId))
      .returning();

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[commentId] - Delete a comment
export async function DELETE(
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

    // Check if comment exists and belongs to user
    const [existingComment] = await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.id, commentId),
          eq(comments.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Soft delete: Mark as deleted instead of removing from database
    await db
      .update(comments)
      .set({
        content: '[deleted]',
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, commentId));

    // Decrease reply count of parent comment if this is a reply
    if (existingComment.parentCommentId) {
      await db
        .update(comments)
        .set({
          replyCount: Math.max(0, existingComment.replyCount - 1),
          updatedAt: new Date(),
        })
        .where(eq(comments.id, existingComment.parentCommentId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

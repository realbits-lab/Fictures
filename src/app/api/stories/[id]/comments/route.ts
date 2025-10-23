import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { comments, users } from '@/lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { z } from 'zod';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  chapterId: z.string().optional(),
  sceneId: z.string().optional(),
  parentCommentId: z.string().optional(),
});

// GET /api/stories/[id]/comments - Fetch comments for a story
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storyId } = await params;
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    const sceneId = searchParams.get('sceneId');

    // Build the where clause
    let whereClause = eq(comments.storyId, storyId);

    if (sceneId) {
      whereClause = and(whereClause, eq(comments.sceneId, sceneId))!;
    } else if (chapterId) {
      whereClause = and(whereClause, eq(comments.chapterId, chapterId))!;
    }

    // Fetch top-level comments (no parent) with user information
    const topLevelComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        userId: comments.userId,
        userName: users.name,
        userImage: users.image,
        storyId: comments.storyId,
        chapterId: comments.chapterId,
        sceneId: comments.sceneId,
        parentCommentId: comments.parentCommentId,
        depth: comments.depth,
        likeCount: comments.likeCount,
        replyCount: comments.replyCount,
        isEdited: comments.isEdited,
        isDeleted: comments.isDeleted,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(and(whereClause, isNull(comments.parentCommentId))!)
      .orderBy(desc(comments.createdAt));

    // Fetch all replies for these comments
    if (topLevelComments.length > 0) {
      const commentIds = topLevelComments.map(c => c.id);
      const replies = await db
        .select({
          id: comments.id,
          content: comments.content,
          userId: comments.userId,
          userName: users.name,
          userImage: users.image,
          storyId: comments.storyId,
          chapterId: comments.chapterId,
          sceneId: comments.sceneId,
          parentCommentId: comments.parentCommentId,
          depth: comments.depth,
          likeCount: comments.likeCount,
          replyCount: comments.replyCount,
          isEdited: comments.isEdited,
          isDeleted: comments.isDeleted,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(
          and(
            eq(comments.storyId, storyId),
            eq(comments.parentCommentId, commentIds[0])
          )!
        )
        .orderBy(comments.createdAt);

      // Build a nested structure
      const commentsWithReplies = topLevelComments.map(comment => ({
        ...comment,
        replies: replies.filter(r => r.parentCommentId === comment.id),
      }));

      return NextResponse.json({ comments: commentsWithReplies });
    }

    return NextResponse.json({ comments: topLevelComments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/stories/[id]/comments - Create a new comment
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

    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // Calculate depth if this is a reply
    let depth = 0;
    if (validatedData.parentCommentId) {
      const parentComment = await db
        .select({ depth: comments.depth })
        .from(comments)
        .where(eq(comments.id, validatedData.parentCommentId))
        .limit(1);

      if (parentComment.length === 0) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }

      depth = parentComment[0].depth + 1;

      // Enforce max depth of 3 as per spec
      if (depth > 3) {
        return NextResponse.json(
          { error: 'Maximum comment depth exceeded' },
          { status: 400 }
        );
      }

      // Increment reply count of parent comment
      await db
        .update(comments)
        .set({
          replyCount: parentComment[0].depth + 1,
          updatedAt: new Date()
        })
        .where(eq(comments.id, validatedData.parentCommentId));
    }

    // Create the comment
    const commentId = nanoid();
    const [newComment] = await db
      .insert(comments)
      .values({
        id: commentId,
        content: validatedData.content,
        userId: session.user.id,
        storyId,
        chapterId: validatedData.chapterId || null,
        sceneId: validatedData.sceneId || null,
        parentCommentId: validatedData.parentCommentId || null,
        depth,
        likeCount: 0,
        replyCount: 0,
        isEdited: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Fetch user info to return with comment
    const [user] = await db
      .select({
        name: users.name,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return NextResponse.json({
      comment: {
        ...newComment,
        userName: user?.name,
        userImage: user?.image,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

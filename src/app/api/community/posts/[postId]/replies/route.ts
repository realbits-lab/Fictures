import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { communityReplies, communityPosts, users } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * GET /api/community/posts/[postId]/replies
 * Get all replies for a specific post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Post ID is required' },
        { status: 400 }
      );
    }

    const replies = await db
      .select({
        id: communityReplies.id,
        content: communityReplies.content,
        contentType: communityReplies.contentType,
        contentHtml: communityReplies.contentHtml,
        contentImages: communityReplies.contentImages,
        postId: communityReplies.postId,
        parentReplyId: communityReplies.parentReplyId,
        depth: communityReplies.depth,
        isEdited: communityReplies.isEdited,
        editCount: communityReplies.editCount,
        lastEditedAt: communityReplies.lastEditedAt,
        likes: communityReplies.likes,
        mentions: communityReplies.mentions,
        createdAt: communityReplies.createdAt,
        updatedAt: communityReplies.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
        },
      })
      .from(communityReplies)
      .leftJoin(users, eq(communityReplies.authorId, users.id))
      .where(and(
        eq(communityReplies.postId, postId),
        eq(communityReplies.isDeleted, false)
      ))
      .orderBy(desc(communityReplies.createdAt));

    return NextResponse.json({
      success: true,
      replies,
      total: replies.length,
    });

  } catch (error) {
    console.error('Error fetching post replies:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch replies' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/posts/[postId]/replies
 * Create a new reply to a post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to reply' },
        { status: 401 }
      );
    }

    const { postId } = await params;
    const body = await request.json();
    const { content, contentHtml, parentReplyId = null, mentions = [] } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Content is required' },
        { status: 400 }
      );
    }

    let depth = 0;
    if (parentReplyId) {
      const parentReply = await db
        .select({ depth: communityReplies.depth })
        .from(communityReplies)
        .where(eq(communityReplies.id, parentReplyId))
        .limit(1);

      if (parentReply.length > 0) {
        depth = (parentReply[0].depth || 0) + 1;
      }
    }

    const reply = await db.insert(communityReplies).values({
      id: nanoid(),
      content,
      contentType: 'markdown',
      contentHtml,
      postId,
      authorId: session.user.id,
      parentReplyId,
      depth,
      mentions,
    }).returning();

    await db
      .update(communityPosts)
      .set({
        replies: sql`${communityPosts.replies} + 1`,
        lastActivityAt: new Date(),
      })
      .where(eq(communityPosts.id, postId));

    return NextResponse.json({
      success: true,
      reply: reply[0],
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating post reply:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create reply' },
      { status: 500 }
    );
  }
}

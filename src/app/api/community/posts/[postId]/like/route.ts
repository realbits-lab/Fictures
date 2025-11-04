import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { postLikes, communityPosts } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * POST /api/community/posts/[postId]/like
 * Toggle like on a community post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to like posts' },
        { status: 401 }
      );
    }

    const { postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Post ID is required' },
        { status: 400 }
      );
    }

    const existingLike = await db
      .select()
      .from(postLikes)
      .where(and(
        eq(postLikes.postId, postId),
        eq(postLikes.userId, session.user.id)
      ))
      .limit(1);

    if (existingLike.length > 0) {
      await db
        .delete(postLikes)
        .where(and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, session.user.id)
        ));

      await db
        .update(communityPosts)
        .set({
          likes: sql`${communityPosts.likes} - 1`,
        })
        .where(eq(communityPosts.id, postId));

      return NextResponse.json({
        success: true,
        liked: false,
        message: 'Like removed',
      });
    } else {
      await db.insert(postLikes).values({
        postId,
        userId: session.user.id,
      });

      await db
        .update(communityPosts)
        .set({
          likes: sql`${communityPosts.likes} + 1`,
        })
        .where(eq(communityPosts.id, postId));

      return NextResponse.json({
        success: true,
        liked: true,
        message: 'Like added',
      });
    }

  } catch (error) {
    console.error('Error toggling post like:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}

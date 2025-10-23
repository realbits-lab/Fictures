import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { communityPosts, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/community/posts/[storyId]
 * Get all posts for a specific story
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;

    if (!storyId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Story ID is required' },
        { status: 400 }
      );
    }

    const posts = await db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        content: communityPosts.content,
        contentType: communityPosts.contentType,
        contentHtml: communityPosts.contentHtml,
        contentImages: communityPosts.contentImages,
        storyId: communityPosts.storyId,
        type: communityPosts.type,
        isPinned: communityPosts.isPinned,
        isLocked: communityPosts.isLocked,
        isEdited: communityPosts.isEdited,
        editCount: communityPosts.editCount,
        lastEditedAt: communityPosts.lastEditedAt,
        likes: communityPosts.likes,
        replies: communityPosts.replies,
        views: communityPosts.views,
        tags: communityPosts.tags,
        mentions: communityPosts.mentions,
        lastActivityAt: communityPosts.lastActivityAt,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
        },
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.authorId, users.id))
      .where(and(
        eq(communityPosts.storyId, storyId),
        eq(communityPosts.isDeleted, false),
        eq(communityPosts.moderationStatus, 'approved')
      ))
      .orderBy(
        desc(communityPosts.isPinned),
        desc(communityPosts.lastActivityAt)
      );

    return NextResponse.json({
      success: true,
      posts,
      total: posts.length,
    });

  } catch (error) {
    console.error('Error fetching community posts:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

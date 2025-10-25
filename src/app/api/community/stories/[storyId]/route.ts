import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stories, users, communityPosts, characters, settings } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';

/**
 * GET /api/community/stories/[storyId]
 * Get story details with community stats
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

    // Fetch story with author info
    const storyData = await db
      .select({
        id: stories.id,
        title: stories.title,
        description: stories.description,
        genre: stories.genre,
        status: stories.status,
        viewCount: stories.viewCount,
        rating: stories.rating,
        ratingCount: stories.ratingCount,
        author: {
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
        },
      })
      .from(stories)
      .leftJoin(users, eq(stories.authorId, users.id))
      .where(eq(stories.id, storyId))
      .limit(1);

    if (storyData.length === 0) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Story not found' },
        { status: 404 }
      );
    }

    const story = storyData[0];

    // Count total posts for this story
    const postCountResult = await db
      .select({ count: count() })
      .from(communityPosts)
      .where(
        and(
          eq(communityPosts.storyId, storyId),
          eq(communityPosts.isDeleted, false),
          eq(communityPosts.moderationStatus, 'approved')
        )
      );

    const totalPosts = postCountResult[0]?.count || 0;

    // For now, we'll use viewCount as a proxy for members
    // In a real system, you'd want a separate table for story followers/members
    const totalMembers = Math.floor((story.viewCount || 0) * 0.1); // Estimate 10% of viewers become members

    // Fetch characters for this story
    const storyCharacters = await db
      .select({
        id: characters.id,
        name: characters.name,
        role: characters.role,
        summary: characters.summary,
        imageUrl: characters.imageUrl,
        isMain: characters.isMain,
      })
      .from(characters)
      .where(eq(characters.storyId, storyId));

    // Fetch settings for this story
    const storySettings = await db
      .select({
        id: settings.id,
        name: settings.name,
        description: settings.description,
        mood: settings.mood,
        imageUrl: settings.imageUrl,
      })
      .from(settings)
      .where(eq(settings.storyId, storyId));

    return NextResponse.json({
      success: true,
      story: {
        id: story.id,
        title: story.title,
        description: story.description,
        genre: story.genre,
        status: story.status,
        author: story.author,
        stats: {
          totalPosts,
          totalMembers,
          totalViews: story.viewCount || 0,
          averageRating: story.rating ? story.rating / 10 : 0, // Convert from integer to decimal (47 -> 4.7)
          ratingCount: story.ratingCount || 0,
        },
        characters: storyCharacters,
        settings: storySettings,
      },
    });

  } catch (error) {
    console.error('Error fetching story data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch story data' },
      { status: 500 }
    );
  }
}

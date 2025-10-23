import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { stories, users, communityPosts } from '@/lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { createHash } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // Get only public stories with their authors
    const publicStories = await db
      .select({
        id: stories.id,
        title: stories.title,
        description: stories.description,
        genre: stories.genre,
        status: stories.status,
        viewCount: stories.viewCount,
        rating: stories.rating,
        ratingCount: stories.ratingCount,
        currentWordCount: stories.currentWordCount,
        createdAt: stories.createdAt,
        updatedAt: stories.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          username: users.username,
        },
      })
      .from(stories)
      .leftJoin(users, eq(stories.authorId, users.id))
      .where(eq(stories.status, 'published'))
      .orderBy(desc(stories.updatedAt));

    // Get real community stats from database
    const storiesWithStats = await Promise.all(
      publicStories.map(async (story) => {
        // Count total posts for this story (excluding deleted)
        const postCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(communityPosts)
          .where(and(
            eq(communityPosts.storyId, story.id),
            eq(communityPosts.isDeleted, false)
          ));
        const totalPosts = Number(postCountResult[0]?.count || 0);

        // Get last activity from most recent post
        const lastPostResult = await db
          .select({ lastActivityAt: communityPosts.lastActivityAt })
          .from(communityPosts)
          .where(and(
            eq(communityPosts.storyId, story.id),
            eq(communityPosts.isDeleted, false)
          ))
          .orderBy(desc(communityPosts.lastActivityAt))
          .limit(1);
        const lastActivity = lastPostResult[0]?.lastActivityAt || story.updatedAt;

        // Count unique members (authors who posted)
        const memberCountResult = await db
          .selectDistinct({ authorId: communityPosts.authorId })
          .from(communityPosts)
          .where(and(
            eq(communityPosts.storyId, story.id),
            eq(communityPosts.isDeleted, false)
          ));
        const totalMembers = memberCountResult.length;

        // Determine if active (has posts in last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const isActive = lastActivity > sevenDaysAgo;

        return {
          ...story,
          totalPosts,
          totalMembers,
          isActive,
          lastActivity,
        };
      })
    );

    const response = {
      success: true,
      stories: storiesWithStats,
      total: storiesWithStats.length,
      metadata: {
        fetchedAt: new Date().toISOString(),
        lastUpdated: publicStories.length > 0
          ? publicStories.reduce((latest, story) =>
              !latest || (story.updatedAt && story.updatedAt > latest) ? story.updatedAt : latest,
              null as Date | null
            )
          : new Date().toISOString()
      }
    };

    // Generate ETag based on community stories data (excluding random mock data)
    const contentForHash = JSON.stringify({
      storiesData: publicStories.map(story => ({
        id: story.id,
        title: story.title,
        updatedAt: story.updatedAt,
        status: story.status,
        viewCount: story.viewCount,
        rating: story.rating,
        wordCount: story.currentWordCount,
        author: story.author
      })),
      totalStories: storiesWithStats.length,
      lastUpdated: response.metadata.lastUpdated
    });
    const etag = createHash('md5').update(contentForHash).digest('hex');

    // Check if client has the same version
    const clientETag = request.headers.get('if-none-match');
    if (clientETag === etag) {
      return new Response(null, { status: 304 });
    }

    // Set cache headers optimized for community content
    const headers = {
      'Content-Type': 'application/json',
      'ETag': etag,
      // Medium cache for community content since it changes moderately
      'Cache-Control': 'public, max-age=1200, stale-while-revalidate=2400', // 20min cache, 40min stale
      'X-Content-Type': 'community-stories',
      'X-Last-Modified': (response.metadata.lastUpdated instanceof Date
        ? response.metadata.lastUpdated.toISOString()
        : response.metadata.lastUpdated) || new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('❌ Error fetching community stories:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch community stories',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
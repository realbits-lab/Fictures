import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { stories, users, communityPosts } from '@/lib/db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get only public stories with their authors and community stats
    const publicStories = await db
      .select({
        id: stories.id,
        title: stories.title,
        description: stories.description,
        genre: stories.genre,
        status: stories.status,
        coverImage: stories.coverImage,
        isPublic: stories.isPublic,
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
      .where(eq(stories.isPublic, true))
      .orderBy(desc(stories.updatedAt));

    // Get community stats for each public story
    const storiesWithStats = await Promise.all(
      publicStories.map(async (story) => {
        // Get community post count for this story
        const [postStats] = await db
          .select({
            totalPosts: count(communityPosts.id),
          })
          .from(communityPosts)
          .where(eq(communityPosts.storyId, story.id));

        // Calculate community activity level based on recent posts
        const [recentActivity] = await db
          .select({
            recentPosts: count(communityPosts.id),
          })
          .from(communityPosts)
          .where(
            and(
              eq(communityPosts.storyId, story.id),
              sql`${communityPosts.createdAt} > NOW() - INTERVAL '7 days'`
            )
          );

        return {
          ...story,
          totalPosts: postStats?.totalPosts || 0,
          totalMembers: story.viewCount || 0, // Using viewCount as proxy for members for now
          isActive: (recentActivity?.recentPosts || 0) > 0,
          lastActivity: story.updatedAt,
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        stories: storiesWithStats,
        total: storiesWithStats.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

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
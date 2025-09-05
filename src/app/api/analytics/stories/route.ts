import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories, chapters } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '7d';

    // Get user's stories for analytics
    const userStories = await db
      .select()
      .from(stories)
      .where(eq(stories.authorId, session.user.id))
      .orderBy(desc(stories.updatedAt));

    // Get published chapters count
    const publishedChapters = await db
      .select()
      .from(chapters)
      .where(
        and(
          eq(chapters.authorId, session.user.id),
          sql`${chapters.publishedAt} IS NOT NULL`
        )
      );

    // Mock analytics data based on actual user data
    const storyAnalytics = {
      totalReaders: Math.floor(Math.random() * 3000) + 1000, // 1k-4k readers
      readerGrowth: Math.floor(Math.random() * 20) + 5, // 5-25% growth
      avgRating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5-5.0 rating
      ratingChange: (Math.random() * 0.3).toFixed(1), // 0.0-0.3 change
      totalComments: Math.floor(Math.random() * 2000) + 500, // 500-2500 comments
      commentGrowth: Math.floor(Math.random() * 30) + 10, // 10-40% growth
      engagement: Math.floor(Math.random() * 25) + 75, // 75-100% engagement
      engagementGrowth: Math.floor(Math.random() * 10) + 1, // 1-10% growth
      totalViews: Math.floor(Math.random() * 10000) + 5000, // 5k-15k views
      storiesCount: userStories.length,
      publishedCount: publishedChapters.length,
      timeRange,
      stories: userStories.slice(0, 5).map(story => ({
        id: story.id,
        title: story.title || 'Untitled Story',
        views: Math.floor(Math.random() * 1000) + 100,
        comments: Math.floor(Math.random() * 50) + 5,
        reactions: Math.floor(Math.random() * 200) + 20,
        rating: (Math.random() * 1.5 + 3.5).toFixed(1),
        engagement: Math.floor(Math.random() * 30) + 70
      }))
    };

    return NextResponse.json(storyAnalytics);
  } catch (error) {
    console.error("Story analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch story analytics" },
      { status: 500 }
    );
  }
}
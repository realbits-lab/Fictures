import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stories, users, chapters } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * GET /api/featured-story
 * Get the best story to feature on the landing page
 * Selection criteria:
 * 1. Must be published
 * 2. Must have at least one published chapter
 * 3. Prioritize by: rating, view count, and word count
 */
export async function GET() {
  try {
    // Get published stories with their stats
    const publishedStories = await db
      .select({
        id: stories.id,
        title: stories.title,
        summary: stories.summary,
        genre: stories.genre,
        viewCount: stories.viewCount,
        rating: stories.rating,
        ratingCount: stories.ratingCount,
        status: stories.status,
        author: {
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
        },
      })
      .from(stories)
      .leftJoin(users, eq(stories.authorId, users.id))
      .where(eq(stories.status, 'published'))
      .orderBy(
        desc(stories.rating),
        desc(stories.viewCount),
      )
      .limit(10);

    if (publishedStories.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No published stories available',
      }, { status: 404 });
    }

    // Filter stories that have at least one published chapter
    const storiesWithChapters = [];
    for (const story of publishedStories) {
      const chapterCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(chapters)
        .where(
          and(
            eq(chapters.storyId, story.id),
            eq(chapters.status, 'published')
          )
        );

      if (Number(chapterCount[0].count) > 0) {
        storiesWithChapters.push({
          ...story,
          publishedChapterCount: Number(chapterCount[0].count),
        });
      }
    }

    if (storiesWithChapters.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No stories with published chapters available',
      }, { status: 404 });
    }

    // Return the top story
    const featuredStory = storiesWithChapters[0];

    return NextResponse.json({
      success: true,
      story: {
        id: featuredStory.id,
        title: featuredStory.title,
        summary: featuredStory.summary,
        genre: featuredStory.genre,
        author: featuredStory.author,
        stats: {
          viewCount: featuredStory.viewCount || 0,
          rating: featuredStory.rating ? featuredStory.rating / 10 : 0,
          ratingCount: featuredStory.ratingCount || 0,
          chapterCount: featuredStory.publishedChapterCount,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching featured story:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch featured story' },
      { status: 500 }
    );
  }
}

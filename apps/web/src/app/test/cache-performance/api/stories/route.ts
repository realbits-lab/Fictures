import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stories, chapters, scenes } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * GET /test/cache-performance/api/stories
 *
 * Returns list of test stories for cache performance testing
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Fetch test stories (from cache-test@fictures.xyz user)
    const testStories = await db
      .select({
        id: stories.id,
        title: stories.title,
        status: stories.status,
        viewCount: stories.viewCount,
        authorId: stories.authorId,
      })
      .from(stories)
      .where(
        sql`${stories.title} LIKE 'Cache Test Story%'`
      )
      .orderBy(stories.title);

    // Get chapter and scene counts for each story
    const enrichedStories = await Promise.all(
      testStories.map(async (story) => {
        const [chapterCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(chapters)
          .where(eq(chapters.storyId, story.id));

        const [sceneCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(scenes)
          .where(
            sql`${scenes.chapterId} IN (
              SELECT id FROM chapters WHERE story_id = ${story.id}
            )`
          );

        return {
          ...story,
          chaptersCount: Number(chapterCount.count),
          scenesCount: Number(sceneCount.count),
        };
      })
    );

    const duration = Date.now() - startTime;

    console.log(`[Cache Test API] Stories list fetched in ${duration}ms`);

    return NextResponse.json(enrichedStories, {
      headers: {
        'X-Response-Time': `${duration}ms`,
        'X-Cache-Hit': 'false',
      },
    });
  } catch (error: any) {
    console.error('[Cache Test API] Error fetching stories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test stories', details: error.message },
      { status: 500 }
    );
  }
}

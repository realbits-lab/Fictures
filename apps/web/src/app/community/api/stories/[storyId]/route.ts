import { NextRequest, NextResponse } from 'next/server';
import { getCommunityStory } from '@/lib/db/cached-queries';
import { getPerformanceLogger } from '@/lib/cache/performance-logger';

/**
 * GET /api/community/stories/[storyId]
 * Get story details with community stats
 *
 * Caching:
 * - Redis: 1 hour (public content, shared by all users)
 * - Client SWR: 30 minutes
 * - localStorage: 1 hour
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const perfLogger = getPerformanceLogger();
  const operationId = `get-community-story-${Date.now()}`;
  let storyId: string | undefined;

  try {
    ({ storyId } = await params);

    if (!storyId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Story ID is required' },
        { status: 400 }
      );
    }

    perfLogger.start(operationId, 'GET /api/community/stories/[storyId]', {
      apiRoute: true,
      storyId
    });

    const story = await getCommunityStory(storyId);

    if (!story) {
      perfLogger.end(operationId, { notFound: true });
      return NextResponse.json(
        { error: 'Not Found', message: 'Story not found' },
        { status: 404 }
      );
    }

    const totalDuration = perfLogger.end(operationId, {
      cached: true,
      storyId
    });

    return NextResponse.json({
      success: true,
      story,
    }, {
      headers: {
        'X-Server-Timing': `total;dur=${totalDuration}`,
        'X-Server-Cache': 'ENABLED',
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600', // 30min cache, 1hr stale
      }
    });

  } catch (error) {
    perfLogger.end(operationId, { error: true });
    console.error('[API] Error fetching community story:', error);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[API] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      storyId,
    });
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch story data',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

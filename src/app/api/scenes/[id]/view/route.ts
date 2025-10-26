/**
 * Scene View Tracking API
 *
 * POST /api/scenes/[id]/view
 * - Tracks scene views for both logged-in and anonymous users
 * - Prevents duplicate counting for same user/session
 * - Updates scene view counts in real-time
 */

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scenes as scenesTable, sceneViews as sceneViewsTable } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getOrCreateSessionId } from '@/lib/utils/session';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sceneId } = await context.params;

    // Parse request body for reading format
    const body = await request.json().catch(() => ({}));
    const readingFormat: 'novel' | 'comic' = body.reading_format === 'comic' ? 'comic' : 'novel';

    // Get authentication status
    const session = await auth();
    const userId = session?.user?.id;

    // Get or create session ID for anonymous users
    const sessionId = await getOrCreateSessionId(userId);

    // Get client information
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check if scene exists
    const sceneExists = await db
      .select({ id: scenesTable.id })
      .from(scenesTable)
      .where(eq(scenesTable.id, sceneId))
      .limit(1);

    if (sceneExists.length === 0) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    // Check if this user/session already viewed this scene in this format
    const existingView = await db
      .select({ id: sceneViewsTable.id })
      .from(sceneViewsTable)
      .where(
        and(
          eq(sceneViewsTable.sceneId, sceneId),
          eq(sceneViewsTable.readingFormat, readingFormat),
          userId
            ? eq(sceneViewsTable.userId, userId)
            : eq(sceneViewsTable.sessionId, sessionId!)
        )
      )
      .limit(1);

    let isNewView = false;

    if (existingView.length === 0) {
      // Create new view record
      await db.insert(sceneViewsTable).values({
        id: nanoid(),
        sceneId,
        userId: userId || null,
        sessionId: sessionId || null,
        readingFormat,
        ipAddress,
        userAgent,
        viewedAt: new Date(),
      });

      isNewView = true;

      // Update scene's unique view count for this format only for new viewers
      const formatUniqueCount = readingFormat === 'novel'
        ? scenesTable.novelUniqueViewCount
        : scenesTable.comicUniqueViewCount;

      await db
        .update(scenesTable)
        .set({
          uniqueViewCount: sql`${scenesTable.uniqueViewCount} + 1`,
          [readingFormat === 'novel' ? 'novelUniqueViewCount' : 'comicUniqueViewCount']: sql`${formatUniqueCount} + 1`,
          lastViewedAt: new Date(),
        })
        .where(eq(scenesTable.id, sceneId));
    }

    // Always update total view count and format-specific view count
    const formatViewCount = readingFormat === 'novel'
      ? scenesTable.novelViewCount
      : scenesTable.comicViewCount;

    await db
      .update(scenesTable)
      .set({
        viewCount: sql`${scenesTable.viewCount} + 1`,
        [readingFormat === 'novel' ? 'novelViewCount' : 'comicViewCount']: sql`${formatViewCount} + 1`,
        lastViewedAt: new Date(),
      })
      .where(eq(scenesTable.id, sceneId));

    // Get updated counts
    const updatedScene = await db
      .select({
        viewCount: scenesTable.viewCount,
        uniqueViewCount: scenesTable.uniqueViewCount,
        novelViewCount: scenesTable.novelViewCount,
        novelUniqueViewCount: scenesTable.novelUniqueViewCount,
        comicViewCount: scenesTable.comicViewCount,
        comicUniqueViewCount: scenesTable.comicUniqueViewCount,
      })
      .from(scenesTable)
      .where(eq(scenesTable.id, sceneId))
      .limit(1);

    return NextResponse.json({
      success: true,
      sceneId,
      isNewView,
      readingFormat,
      viewCount: updatedScene[0].viewCount,
      uniqueViewCount: updatedScene[0].uniqueViewCount,
      novelViewCount: updatedScene[0].novelViewCount,
      novelUniqueViewCount: updatedScene[0].novelUniqueViewCount,
      comicViewCount: updatedScene[0].comicViewCount,
      comicUniqueViewCount: updatedScene[0].comicUniqueViewCount,
      viewer: {
        userId: userId || null,
        sessionId: sessionId || null,
        isAuthenticated: !!userId,
      },
    });
  } catch (error) {
    console.error('Error tracking scene view:', error);
    return NextResponse.json(
      { error: 'Failed to track scene view' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scenes/[id]/view
 * - Get view statistics for a scene
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sceneId } = await context.params;

    // Get scene view stats
    const scene = await db
      .select({
        viewCount: scenesTable.viewCount,
        uniqueViewCount: scenesTable.uniqueViewCount,
        lastViewedAt: scenesTable.lastViewedAt,
        novelViewCount: scenesTable.novelViewCount,
        novelUniqueViewCount: scenesTable.novelUniqueViewCount,
        comicViewCount: scenesTable.comicViewCount,
        comicUniqueViewCount: scenesTable.comicUniqueViewCount,
      })
      .from(scenesTable)
      .where(eq(scenesTable.id, sceneId))
      .limit(1);

    if (scene.length === 0) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    // Check if current user/session has viewed this scene
    const session = await auth();
    const userId = session?.user?.id;
    const sessionId = await getOrCreateSessionId(userId);

    const hasViewed = await db
      .select({ id: sceneViewsTable.id })
      .from(sceneViewsTable)
      .where(
        and(
          eq(sceneViewsTable.sceneId, sceneId),
          userId
            ? eq(sceneViewsTable.userId, userId)
            : eq(sceneViewsTable.sessionId, sessionId!)
        )
      )
      .limit(1);

    return NextResponse.json({
      sceneId,
      viewCount: scene[0].viewCount,
      uniqueViewCount: scene[0].uniqueViewCount,
      lastViewedAt: scene[0].lastViewedAt,
      novelViewCount: scene[0].novelViewCount,
      novelUniqueViewCount: scene[0].novelUniqueViewCount,
      comicViewCount: scene[0].comicViewCount,
      comicUniqueViewCount: scene[0].comicUniqueViewCount,
      hasViewedByCurrentUser: hasViewed.length > 0,
    });
  } catch (error) {
    console.error('Error getting scene view stats:', error);
    return NextResponse.json(
      { error: 'Failed to get scene view stats' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { analyticsEvents, readingSessions, dailyStoryMetrics } from '@/lib/db/schema';
import { eq, and, gte, lte, count, avg, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * GET /api/cron/analytics-daily
 *
 * Daily aggregation cron job for analytics metrics
 * Runs every day at 1:00 AM UTC via Vercel cron
 *
 * Aggregates yesterday's analytics events into daily_story_metrics table
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get yesterday's date range (UTC)
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setUTCHours(23, 59, 59, 999);

    const yesterdayStart = yesterday.toISOString();
    const yesterdayEnd = endOfYesterday.toISOString();
    const yesterdayStartISO = yesterdayStart;

    // Get all unique story IDs that had activity yesterday
    const activeStories = await db
      .selectDistinct({
        storyId: analyticsEvents.storyId,
      })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.timestamp, yesterdayStart),
          lte(analyticsEvents.timestamp, yesterdayEnd)
        )
      );

    const storyIds = activeStories
      .map((s) => s.storyId)
      .filter((id): id is string => id !== null);

    if (storyIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No activity yesterday',
        date: yesterdayStartISO.split('T')[0],
        metricsAggregated: 0,
      });
    }

    // Aggregate metrics for each story
    const aggregatedMetrics = [];

    for (const storyId of storyIds) {
      // Get event metrics
      const [eventMetrics] = await db
        .select({
          totalViews: count(
            sql`DISTINCT CASE WHEN ${analyticsEvents.eventType} = 'story_view' THEN ${analyticsEvents.id} END`
          ),
          uniqueReaders: sql<number>`COUNT(DISTINCT ${analyticsEvents.userId})`,
          comments: count(
            sql`CASE WHEN ${analyticsEvents.eventType} = 'comment_created' THEN 1 END`
          ),
          likes: count(
            sql`CASE WHEN ${analyticsEvents.eventType} = 'story_liked' THEN 1 END`
          ),
          shares: count(
            sql`CASE WHEN ${analyticsEvents.eventType} = 'share' THEN 1 END`
          ),
          bookmarks: count(
            sql`CASE WHEN ${analyticsEvents.eventType} = 'bookmark' THEN 1 END`
          ),
          mobileUsers: count(
            sql`DISTINCT CASE WHEN ${analyticsEvents.metadata}->>'deviceType' = 'mobile' THEN ${analyticsEvents.userId} END`
          ),
          desktopUsers: count(
            sql`DISTINCT CASE WHEN ${analyticsEvents.metadata}->>'deviceType' = 'desktop' THEN ${analyticsEvents.userId} END`
          ),
        })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.storyId, storyId),
            gte(analyticsEvents.timestamp, yesterdayStart),
            lte(analyticsEvents.timestamp, yesterdayEnd)
          )
        );

      // Get session metrics
      const [sessionMetrics] = await db
        .select({
          avgDuration: avg(readingSessions.durationSeconds),
          totalSessions: count(readingSessions.id),
          completedSessions: count(
            sql`CASE WHEN ${readingSessions.completedStory} = true THEN 1 END`
          ),
          avgChapters: avg(readingSessions.chaptersRead),
        })
        .from(readingSessions)
        .where(
          and(
            eq(readingSessions.storyId, storyId),
            gte(readingSessions.startTime, yesterdayStart),
            lte(readingSessions.startTime, yesterdayEnd)
          )
        );

      // Calculate rates
      const engagementRate =
        eventMetrics.totalViews > 0
          ? (
              ((eventMetrics.comments + eventMetrics.likes + eventMetrics.shares) /
                eventMetrics.totalViews) *
              100
            ).toFixed(2)
          : '0.00';

      const completionRate =
        sessionMetrics.totalSessions > 0
          ? ((sessionMetrics.completedSessions / sessionMetrics.totalSessions) * 100).toFixed(
              2
            )
          : '0.00';

      const avgChaptersPerSession = sessionMetrics.avgChapters
        ? Number(sessionMetrics.avgChapters).toFixed(2)
        : '0.00';

      // Insert daily metrics
      await db.insert(dailyStoryMetrics).values({
        id: nanoid(),
        storyId,
        date: yesterdayStartISO,
        totalViews: eventMetrics.totalViews,
        uniqueReaders: eventMetrics.uniqueReaders,
        newReaders: 0, // TODO: Calculate new vs returning readers
        comments: eventMetrics.comments,
        likes: eventMetrics.likes,
        shares: eventMetrics.shares,
        bookmarks: eventMetrics.bookmarks,
        engagementRate,
        avgSessionDuration: sessionMetrics.avgDuration
          ? Math.round(Number(sessionMetrics.avgDuration))
          : 0,
        totalSessions: sessionMetrics.totalSessions,
        completedSessions: sessionMetrics.completedSessions,
        completionRate,
        avgChaptersPerSession,
        mobileUsers: eventMetrics.mobileUsers,
        desktopUsers: eventMetrics.desktopUsers,
        createdAt: new Date().toISOString(),
      });

      aggregatedMetrics.push({
        storyId,
        views: eventMetrics.totalViews,
        readers: eventMetrics.uniqueReaders,
      });
    }

    console.log(`✅ Aggregated ${aggregatedMetrics.length} daily metrics for ${yesterdayStartISO.split('T')[0]}`);

    return NextResponse.json({
      success: true,
      date: yesterdayStartISO.split('T')[0],
      metricsAggregated: aggregatedMetrics.length,
      stories: aggregatedMetrics,
    });
  } catch (error) {
    console.error('❌ Failed to aggregate daily metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to aggregate metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

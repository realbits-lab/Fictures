import { and, avg, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
    analysisEvents,
    chapters,
    readingSessions,
    sceneEvaluations,
    scenes,
    stories,
} from "@/lib/schemas/database";

// ============================================================================
// Types
// ============================================================================

interface TimeRange {
    start: Date;
    end: Date;
}

export interface StoryAnalytics {
    storyId: string;
    title: string;
    totalViews: number;
    uniqueReaders: number;
    engagement: {
        comments: number;
        likes: number;
        shares: number;
        rate: number;
    };
    retention: {
        returnRate: number;
        completionRate: number;
        avgSessionDuration: number;
    };
    quality: {
        avgScore: number;
        scoresByCategory: {
            plot: number;
            character: number;
            pacing: number;
            prose: number;
            worldBuilding: number;
        };
    };
    trends: {
        viewsChange: number;
        readersChange: number;
        engagementChange: number;
    };
}

export interface StoryListAnalytics {
    id: string;
    title: string;
    summary: string | null;
    genre: string;
    status: string;
    imageUrl: string | null;
    imageVariants: any;
    createdAt: Date;
    views: number;
    readers: number;
    engagement: number;
    trend: "up" | "down" | "stable";
    trendPercentage: number;
}

export interface DailyMetric {
    date: string;
    views: number;
    readers: number;
    engagement: number;
    avgDuration: number;
    completions: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getTimeRange(range: "7d" | "30d" | "90d"): TimeRange {
    const end = new Date();
    const start = new Date();

    switch (range) {
        case "7d":
            start.setDate(start.getDate() - 7);
            break;
        case "30d":
            start.setDate(start.getDate() - 30);
            break;
        case "90d":
            start.setDate(start.getDate() - 90);
            break;
    }

    return { start, end };
}

function getPreviousTimeRange(
    current: TimeRange,
    range: "7d" | "30d" | "90d",
): TimeRange {
    const end = current.start;
    const start = new Date(current.start);

    switch (range) {
        case "7d":
            start.setDate(start.getDate() - 7);
            break;
        case "30d":
            start.setDate(start.getDate() - 30);
            break;
        case "90d":
            start.setDate(start.getDate() - 90);
            break;
    }

    return { start, end };
}

// ============================================================================
// Main Analytics Functions
// ============================================================================

/**
 * Get analysis for all stories owned by a user
 *
 * Returns basic analysis for each story to display on the analysis landing page.
 *
 * @param userId - User ID who owns the stories
 * @param timeRange - Time period for analysis (default: 30d)
 * @returns Array of story analysis
 */
export async function getStoriesAnalysis(
    userId: string,
    timeRange: "7d" | "30d" | "90d" = "30d",
): Promise<StoryListAnalytics[]> {
    const { start, end } = getTimeRange(timeRange);
    const previous = getPreviousTimeRange({ start, end }, timeRange);

    // Fetch stories with current period analytics
    const userStories = await db
        .select({
            id: stories.id,
            title: stories.title,
            summary: stories.summary,
            genre: stories.genre,
            status: stories.status,
            imageUrl: stories.imageUrl,
            imageVariants: stories.imageVariants,
            createdAt: stories.createdAt,
            views: sql<number>`COUNT(DISTINCT CASE WHEN ${analysisEvents.eventType} = 'story_view' AND ${analysisEvents.timestamp} >= ${start.toISOString()} AND ${analysisEvents.timestamp} <= ${end.toISOString()} THEN ${analysisEvents.id} END)`,
            readers: sql<number>`COUNT(DISTINCT CASE WHEN ${analysisEvents.timestamp} >= ${start.toISOString()} AND ${analysisEvents.timestamp} <= ${end.toISOString()} THEN ${analysisEvents.userId} END)`,
            engagement: sql<number>`COUNT(CASE WHEN ${analysisEvents.eventType} IN ('comment_created', 'story_liked', 'share') AND ${analysisEvents.timestamp} >= ${start.toISOString()} AND ${analysisEvents.timestamp} <= ${end.toISOString()} THEN ${analysisEvents.id} END)`,
            previousViews: sql<number>`COUNT(DISTINCT CASE WHEN ${analysisEvents.eventType} = 'story_view' AND ${analysisEvents.timestamp} >= ${previous.start.toISOString()} AND ${analysisEvents.timestamp} < ${previous.end.toISOString()} THEN ${analysisEvents.id} END)`,
        })
        .from(stories)
        .leftJoin(analysisEvents, eq(stories.id, analysisEvents.storyId))
        .where(eq(stories.authorId, userId))
        .groupBy(stories.id)
        .orderBy(desc(stories.createdAt));

    // Calculate trends
    return userStories.map((story) => {
        const trendPercentage =
            story.previousViews > 0
                ? ((story.views - story.previousViews) / story.previousViews) *
                  100
                : 0;

        const trend =
            trendPercentage > 5
                ? "up"
                : trendPercentage < -5
                  ? "down"
                  : "stable";

        return {
            ...story,
            createdAt: new Date(story.createdAt),
            trend,
            trendPercentage,
        };
    });
}

/**
 * Get comprehensive analysis for a single story
 *
 * Returns detailed analysis including quality scores, engagement, retention, and trends.
 *
 * @param storyId - Story ID to analyze
 * @param userId - User ID who owns the story (for verification)
 * @param timeRange - Time period for analysis (default: 30d)
 * @returns Detailed story analysis
 */
export async function getStoryAnalysis(
    storyId: string,
    userId: string,
    timeRange: "7d" | "30d" | "90d" = "30d",
): Promise<StoryAnalytics> {
    const { start, end } = getTimeRange(timeRange);

    // Verify ownership
    const story = await db.query.stories.findFirst({
        where: and(eq(stories.id, storyId), eq(stories.authorId, userId)),
    });

    if (!story) {
        throw new Error("Story not found");
    }

    // Get view and reader stats
    const [viewStats] = await db
        .select({
            totalViews: count(analysisEvents.id),
            uniqueReaders: sql<number>`COUNT(DISTINCT ${analysisEvents.userId})`,
        })
        .from(analysisEvents)
        .where(
            and(
                eq(analysisEvents.storyId, storyId),
                eq(analysisEvents.eventType, "story_view"),
                gte(analysisEvents.timestamp, start.toISOString()),
                lte(analysisEvents.timestamp, end.toISOString()),
            ),
        );

    // Get engagement stats
    const [engagementStats] = await db
        .select({
            comments: count(
                sql`CASE WHEN ${analysisEvents.eventType} = 'comment_created' THEN 1 END`,
            ),
            likes: count(
                sql`CASE WHEN ${analysisEvents.eventType} = 'story_liked' THEN 1 END`,
            ),
            shares: count(
                sql`CASE WHEN ${analysisEvents.eventType} = 'share' THEN 1 END`,
            ),
        })
        .from(analysisEvents)
        .where(
            and(
                eq(analysisEvents.storyId, storyId),
                gte(analysisEvents.timestamp, start.toISOString()),
                lte(analysisEvents.timestamp, end.toISOString()),
            ),
        );

    const engagementRate =
        viewStats.totalViews > 0
            ? ((engagementStats.comments +
                  engagementStats.likes +
                  engagementStats.shares) /
                  viewStats.totalViews) *
              100
            : 0;

    // Get retention stats
    const [retentionStats] = await db
        .select({
            avgDuration: avg(readingSessions.durationSeconds),
            completionRate: sql<number>`
        (COUNT(CASE WHEN ${readingSessions.completedStory} = true THEN 1 END)::float /
         NULLIF(COUNT(*), 0)) * 100
      `,
        })
        .from(readingSessions)
        .where(
            and(
                eq(readingSessions.storyId, storyId),
                gte(readingSessions.startTime, start.toISOString()),
                lte(readingSessions.startTime, end.toISOString()),
            ),
        );

    // Calculate return rate
    const [returnRateData] = await db
        .select({
            returnRate: sql<number>`
        (COUNT(DISTINCT CASE
          WHEN EXISTS (
            SELECT 1 FROM ${analysisEvents} ae2
            WHERE ae2.user_id = ${analysisEvents.userId}
            AND ae2.timestamp::timestamp > ${analysisEvents.timestamp}::timestamp + INTERVAL '7 days'
            AND ae2.story_id = ${storyId}
          ) THEN ${analysisEvents.userId}
        END)::float / NULLIF(COUNT(DISTINCT ${analysisEvents.userId}), 0)) * 100
      `,
        })
        .from(analysisEvents)
        .where(
            and(
                eq(analysisEvents.storyId, storyId),
                eq(analysisEvents.eventType, "story_view"),
                gte(analysisEvents.timestamp, start.toISOString()),
                lte(analysisEvents.timestamp, end.toISOString()),
            ),
        );

    // Get quality scores from scene evaluations
    const sceneScores = await db
        .select({
            plotScore: avg(sceneEvaluations.plotScore),
            characterScore: avg(sceneEvaluations.characterScore),
            pacingScore: avg(sceneEvaluations.pacingScore),
            proseScore: avg(sceneEvaluations.proseScore),
            worldBuildingScore: avg(sceneEvaluations.worldBuildingScore),
        })
        .from(sceneEvaluations)
        .leftJoin(scenes, eq(sceneEvaluations.sceneId, scenes.id))
        .leftJoin(chapters, eq(scenes.chapterId, chapters.id))
        .where(eq(chapters.storyId, storyId));

    const avgScore =
        sceneScores.length > 0
            ? (Number(sceneScores[0].plotScore || 0) +
                  Number(sceneScores[0].characterScore || 0) +
                  Number(sceneScores[0].pacingScore || 0) +
                  Number(sceneScores[0].proseScore || 0) +
                  Number(sceneScores[0].worldBuildingScore || 0)) /
              5
            : 0;

    // Get previous period for trends
    const previous = getPreviousTimeRange({ start, end }, timeRange);

    const [previousStats] = await db
        .select({
            views: count(analysisEvents.id),
            readers: sql<number>`COUNT(DISTINCT ${analysisEvents.userId})`,
            engagement: count(
                sql`CASE WHEN ${analysisEvents.eventType} IN ('comment_created', 'story_liked', 'share') THEN 1 END`,
            ),
        })
        .from(analysisEvents)
        .where(
            and(
                eq(analysisEvents.storyId, storyId),
                gte(analysisEvents.timestamp, previous.start.toISOString()),
                lte(analysisEvents.timestamp, previous.end.toISOString()),
            ),
        );

    const viewsChange =
        previousStats.views > 0
            ? ((viewStats.totalViews - previousStats.views) /
                  previousStats.views) *
              100
            : 0;

    const readersChange =
        previousStats.readers > 0
            ? ((viewStats.uniqueReaders - previousStats.readers) /
                  previousStats.readers) *
              100
            : 0;

    const engagementChange =
        previousStats.engagement > 0
            ? ((engagementStats.comments +
                  engagementStats.likes +
                  engagementStats.shares -
                  previousStats.engagement) /
                  previousStats.engagement) *
              100
            : 0;

    return {
        storyId,
        title: story.title,
        totalViews: viewStats.totalViews,
        uniqueReaders: viewStats.uniqueReaders,
        engagement: {
            comments: engagementStats.comments,
            likes: engagementStats.likes,
            shares: engagementStats.shares,
            rate: engagementRate,
        },
        retention: {
            returnRate: returnRateData.returnRate || 0,
            completionRate: retentionStats.completionRate || 0,
            avgSessionDuration: Number(retentionStats.avgDuration) || 0,
        },
        quality: {
            avgScore,
            scoresByCategory: {
                plot: Number(sceneScores[0]?.plotScore || 0),
                character: Number(sceneScores[0]?.characterScore || 0),
                pacing: Number(sceneScores[0]?.pacingScore || 0),
                prose: Number(sceneScores[0]?.proseScore || 0),
                worldBuilding: Number(sceneScores[0]?.worldBuildingScore || 0),
            },
        },
        trends: {
            viewsChange,
            readersChange,
            engagementChange,
        },
    };
}

/**
 * Get daily metrics for a story
 *
 * Returns time-series data for charts showing metrics by day.
 *
 * @param storyId - Story ID to analyze
 * @param userId - User ID who owns the story (for verification)
 * @param timeRange - Time period for analytics (default: 30d)
 * @returns Array of daily metrics
 */
export async function getDailyMetrics(
    storyId: string,
    userId: string,
    timeRange: "7d" | "30d" | "90d" = "30d",
): Promise<DailyMetric[]> {
    const { start, end } = getTimeRange(timeRange);

    // Verify ownership
    const story = await db.query.stories.findFirst({
        where: and(eq(stories.id, storyId), eq(stories.authorId, userId)),
    });

    if (!story) {
        throw new Error("Story not found");
    }

    // Get daily event metrics
    const dailyData = await db
        .select({
            date: sql<string>`DATE(${analysisEvents.timestamp})`,
            views: count(
                sql`DISTINCT CASE WHEN ${analysisEvents.eventType} = 'story_view' THEN ${analysisEvents.id} END`,
            ),
            readers: sql<number>`COUNT(DISTINCT ${analysisEvents.userId})`,
            engagement: count(
                sql`CASE WHEN ${analysisEvents.eventType} IN ('comment_created', 'story_liked', 'share') THEN 1 END`,
            ),
        })
        .from(analysisEvents)
        .where(
            and(
                eq(analysisEvents.storyId, storyId),
                gte(analysisEvents.timestamp, start.toISOString()),
                lte(analysisEvents.timestamp, end.toISOString()),
            ),
        )
        .groupBy(sql`DATE(${analysisEvents.timestamp})`)
        .orderBy(sql`DATE(${analysisEvents.timestamp})`);

    // Get session metrics by day
    const sessionData = await db
        .select({
            date: sql<string>`DATE(${readingSessions.startTime})`,
            avgDuration: avg(readingSessions.durationSeconds),
            completions: count(
                sql`CASE WHEN ${readingSessions.completedStory} = true THEN 1 END`,
            ),
        })
        .from(readingSessions)
        .where(
            and(
                eq(readingSessions.storyId, storyId),
                gte(readingSessions.startTime, start.toISOString()),
                lte(readingSessions.startTime, end.toISOString()),
            ),
        )
        .groupBy(sql`DATE(${readingSessions.startTime})`)
        .orderBy(sql`DATE(${readingSessions.startTime})`);

    // Merge data
    const mergedData = dailyData.map((day) => {
        const sessionDay = sessionData.find((s) => s.date === day.date);
        return {
            date: day.date,
            views: day.views,
            readers: day.readers,
            engagement: day.engagement,
            avgDuration: sessionDay ? Number(sessionDay.avgDuration) : 0,
            completions: sessionDay ? sessionDay.completions : 0,
        };
    });

    return mergedData;
}

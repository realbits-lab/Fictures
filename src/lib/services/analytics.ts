import { db } from '@/lib/db';
import {
  stories,
  chapters,
  scenes,
  analyticsEvents,
  readingSessions,
  sceneEvaluations,
  communityPosts,
  communityReplies,
  comments,
  users,
} from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql, count, avg, sum, inArray } from 'drizzle-orm';

interface TimeRange {
  start: Date;
  end: Date;
}

function getTimeRange(range: '7d' | '30d' | '90d' | 'all'): TimeRange {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case 'all':
      start.setFullYear(2000);
      break;
  }

  return { start, end };
}

export interface StoryAnalytics {
  totalReaders: number;
  readerGrowth: number;
  avgRating: number;
  totalComments: number;
  engagement: number;
  storiesData: StoryPerformance[];
  trends: TrendData[];
}

export interface StoryPerformance {
  id: string;
  title: string;
  views: number;
  comments: number;
  reactions: number;
  rating: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface TrendData {
  date: string;
  views: number;
  engagement: number;
  newReaders: number;
}

export async function getStoryAnalytics(
  userId: string,
  timeRange: '7d' | '30d' | '90d' | 'all' = '30d'
): Promise<StoryAnalytics> {
  const { start, end } = getTimeRange(timeRange);

  const userStories = await db
    .select({ id: stories.id })
    .from(stories)
    .where(eq(stories.authorId, userId));

  const storyIds = userStories.map(s => s.id);

  if (storyIds.length === 0) {
    return {
      totalReaders: 0,
      readerGrowth: 0,
      avgRating: 0,
      totalComments: 0,
      engagement: 0,
      storiesData: [],
      trends: [],
    };
  }

  const [readerStats] = await db
    .select({
      uniqueReaders: sql<number>`COUNT(DISTINCT ${analyticsEvents.userId})`,
      totalViews: count(analyticsEvents.id),
    })
    .from(analyticsEvents)
    .where(
      and(
        inArray(analyticsEvents.storyId, storyIds),
        eq(analyticsEvents.eventType, 'story_view'),
        gte(analyticsEvents.timestamp, start),
        lte(analyticsEvents.timestamp, end)
      )
    );

  const previousPeriod = getTimeRange(timeRange);
  previousPeriod.end = start;
  previousPeriod.start = new Date(start);
  if (timeRange === '7d') previousPeriod.start.setDate(previousPeriod.start.getDate() - 7);
  else if (timeRange === '30d') previousPeriod.start.setDate(previousPeriod.start.getDate() - 30);
  else if (timeRange === '90d') previousPeriod.start.setDate(previousPeriod.start.getDate() - 90);

  const [previousReaderStats] = await db
    .select({
      uniqueReaders: sql<number>`COUNT(DISTINCT ${analyticsEvents.userId})`,
    })
    .from(analyticsEvents)
    .where(
      and(
        inArray(analyticsEvents.storyId, storyIds),
        eq(analyticsEvents.eventType, 'story_view'),
        gte(analyticsEvents.timestamp, previousPeriod.start),
        lte(analyticsEvents.timestamp, previousPeriod.end)
      )
    );

  const readerGrowth = previousReaderStats?.uniqueReaders > 0
    ? ((readerStats.uniqueReaders - previousReaderStats.uniqueReaders) / previousReaderStats.uniqueReaders) * 100
    : 0;

  const [ratingStats] = await db
    .select({
      avgRating: avg(stories.rating),
    })
    .from(stories)
    .where(
      and(
        eq(stories.authorId, userId),
        inArray(stories.id, storyIds)
      )
    );

  const commentCounts = await db
    .select({
      storyId: comments.storyId,
      count: count(comments.id),
    })
    .from(comments)
    .where(
      and(
        inArray(comments.storyId, storyIds),
        gte(comments.createdAt, start),
        lte(comments.createdAt, end)
      )
    )
    .groupBy(comments.storyId);

  const totalComments = commentCounts.reduce((sum, c) => sum + c.count, 0);

  const likeCounts = await db
    .select({ likes: sum(communityPosts.likes) })
    .from(communityPosts)
    .where(inArray(communityPosts.storyId, storyIds));

  const engagement = readerStats.totalViews > 0
    ? ((totalComments + (Number(likeCounts[0]?.likes) || 0)) / readerStats.totalViews) * 100
    : 0;

  const storiesData = await getStoryPerformanceData(storyIds, start, end);
  const trends = await getTrendData(storyIds, start, end);

  return {
    totalReaders: readerStats.uniqueReaders || 0,
    readerGrowth,
    avgRating: ratingStats.avgRating ? Number(ratingStats.avgRating) / 10 : 0,
    totalComments,
    engagement,
    storiesData,
    trends,
  };
}

async function getStoryPerformanceData(
  storyIds: string[],
  start: Date,
  end: Date
): Promise<StoryPerformance[]> {
  const storyData = await db
    .select({
      id: stories.id,
      title: stories.title,
      rating: stories.rating,
    })
    .from(stories)
    .where(inArray(stories.id, storyIds));

  const viewCounts = await db
    .select({
      storyId: analyticsEvents.storyId,
      views: count(analyticsEvents.id),
    })
    .from(analyticsEvents)
    .where(
      and(
        inArray(analyticsEvents.storyId, storyIds),
        eq(analyticsEvents.eventType, 'story_view'),
        gte(analyticsEvents.timestamp, start),
        lte(analyticsEvents.timestamp, end)
      )
    )
    .groupBy(analyticsEvents.storyId);

  const commentCounts = await db
    .select({
      storyId: comments.storyId,
      count: count(comments.id),
    })
    .from(comments)
    .where(inArray(comments.storyId, storyIds))
    .groupBy(comments.storyId);

  const likeCounts = await db
    .select({
      storyId: communityPosts.storyId,
      likes: sum(communityPosts.likes),
    })
    .from(communityPosts)
    .where(inArray(communityPosts.storyId, storyIds))
    .groupBy(communityPosts.storyId);

  return Promise.all(
    storyData.map(async (story) => {
      const views = viewCounts.find(v => v.storyId === story.id)?.views || 0;
      const commentsCount = commentCounts.find(c => c.storyId === story.id)?.count || 0;
      const reactions = Number(likeCounts.find(l => l.storyId === story.id)?.likes) || 0;

      const previousStart = new Date(start);
      const periodDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      previousStart.setDate(previousStart.getDate() - periodDays);

      const [previousViews] = await db
        .select({
          views: count(analyticsEvents.id),
        })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.storyId, story.id),
            eq(analyticsEvents.eventType, 'story_view'),
            gte(analyticsEvents.timestamp, previousStart),
            lte(analyticsEvents.timestamp, start)
          )
        );

      const trendPercentage = previousViews?.views > 0
        ? ((views - previousViews.views) / previousViews.views) * 100
        : 0;

      const trend = trendPercentage > 5 ? 'up' : trendPercentage < -5 ? 'down' : 'stable';

      return {
        id: story.id,
        title: story.title,
        views,
        comments: commentsCount,
        reactions,
        rating: story.rating ? story.rating / 10 : 0,
        trend,
        trendPercentage,
      };
    })
  );
}

async function getTrendData(
  storyIds: string[],
  start: Date,
  end: Date
): Promise<TrendData[]> {
  const dailyData = await db
    .select({
      date: sql<string>`DATE(${analyticsEvents.timestamp})`,
      views: count(sql`DISTINCT CASE WHEN ${analyticsEvents.eventType} = 'story_view' THEN ${analyticsEvents.id} END`),
      engagements: count(sql`CASE WHEN ${analyticsEvents.eventType} IN ('comment_created', 'story_liked', 'share') THEN ${analyticsEvents.id} END`),
      newReaders: count(sql`DISTINCT ${analyticsEvents.userId}`),
    })
    .from(analyticsEvents)
    .where(
      and(
        inArray(analyticsEvents.storyId, storyIds),
        gte(analyticsEvents.timestamp, start),
        lte(analyticsEvents.timestamp, end)
      )
    )
    .groupBy(sql`DATE(${analyticsEvents.timestamp})`)
    .orderBy(sql`DATE(${analyticsEvents.timestamp})`);

  return dailyData.map(day => ({
    date: day.date,
    views: day.views || 0,
    engagement: day.views > 0 ? ((day.engagements || 0) / day.views) * 100 : 0,
    newReaders: day.newReaders || 0,
  }));
}

export interface ReaderAnalytics {
  topPosts: any[];
  recentComments: any[];
  demographics: Demographics;
  readingPatterns: ReadingPatterns;
}

export interface Demographics {
  totalReaders: number;
  returningReaders: number;
  newReaders: number;
  avgSessionDuration: number;
}

export interface ReadingPatterns {
  peakReadingHours: { hour: number; count: number }[];
  avgSessionDuration: number;
  returnRate: number;
  completionRate: number;
}

export async function getReaderAnalytics(
  userId: string,
  timeRange: '7d' | '30d' | '90d' | 'all' = '30d'
): Promise<ReaderAnalytics> {
  const { start, end } = getTimeRange(timeRange);

  const userStories = await db
    .select({ id: stories.id })
    .from(stories)
    .where(eq(stories.authorId, userId));

  const storyIds = userStories.map(s => s.id);

  const topPosts = await db
    .select()
    .from(communityPosts)
    .where(
      and(
        inArray(communityPosts.storyId, storyIds),
        gte(communityPosts.createdAt, start),
        lte(communityPosts.createdAt, end)
      )
    )
    .orderBy(desc(sql`${communityPosts.likes} + ${communityPosts.views}`))
    .limit(5);

  const recentComments = await db
    .select()
    .from(comments)
    .where(
      and(
        inArray(comments.storyId, storyIds),
        gte(comments.createdAt, start),
        lte(comments.createdAt, end)
      )
    )
    .orderBy(desc(comments.createdAt))
    .limit(10);

  const [demographics] = await db
    .select({
      totalReaders: sql<number>`COUNT(DISTINCT ${analyticsEvents.userId})`,
      newReaders: sql<number>`COUNT(DISTINCT CASE WHEN ${analyticsEvents.eventType} = 'story_view' THEN ${analyticsEvents.userId} END)`,
    })
    .from(analyticsEvents)
    .where(
      and(
        inArray(analyticsEvents.storyId, storyIds),
        gte(analyticsEvents.timestamp, start),
        lte(analyticsEvents.timestamp, end)
      )
    );

  const readingPatterns = await getReadingPatterns(storyIds, start, end);

  return {
    topPosts,
    recentComments,
    demographics: {
      totalReaders: demographics?.totalReaders || 0,
      returningReaders: (demographics?.totalReaders || 0) - (demographics?.newReaders || 0),
      newReaders: demographics?.newReaders || 0,
      avgSessionDuration: readingPatterns.avgSessionDuration,
    },
    readingPatterns,
  };
}

async function getReadingPatterns(
  storyIds: string[],
  start: Date,
  end: Date
): Promise<ReadingPatterns> {
  const hourlyData = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${analyticsEvents.timestamp})`,
      count: count(analyticsEvents.id),
    })
    .from(analyticsEvents)
    .where(
      and(
        inArray(analyticsEvents.storyId, storyIds),
        eq(analyticsEvents.eventType, 'chapter_read_start'),
        gte(analyticsEvents.timestamp, start),
        lte(analyticsEvents.timestamp, end)
      )
    )
    .groupBy(sql`EXTRACT(HOUR FROM ${analyticsEvents.timestamp})`)
    .orderBy(desc(count(analyticsEvents.id)))
    .limit(24);

  const [sessionStats] = await db
    .select({
      avgDuration: avg(readingSessions.durationSeconds),
      completionRate: sql<number>`(COUNT(CASE WHEN ${readingSessions.completedStory} = true THEN 1 END)::float / NULLIF(COUNT(*), 0)) * 100`,
    })
    .from(readingSessions)
    .where(
      and(
        inArray(readingSessions.storyId, storyIds),
        gte(readingSessions.startTime, start),
        lte(readingSessions.startTime, end)
      )
    );

  const [returnRateData] = await db
    .select({
      returnRate: sql<number>`
        (COUNT(DISTINCT CASE
          WHEN EXISTS (
            SELECT 1 FROM ${analyticsEvents} ae2
            WHERE ae2.user_id = ${analyticsEvents.userId}
            AND ae2.timestamp > ${analyticsEvents.timestamp} + INTERVAL '7 days'
          ) THEN ${analyticsEvents.userId}
        END)::float / NULLIF(COUNT(DISTINCT ${analyticsEvents.userId}), 0)) * 100
      `,
    })
    .from(analyticsEvents)
    .where(
      and(
        inArray(analyticsEvents.storyId, storyIds),
        eq(analyticsEvents.eventType, 'story_view'),
        gte(analyticsEvents.timestamp, start),
        lte(analyticsEvents.timestamp, end)
      )
    );

  return {
    peakReadingHours: hourlyData.map(h => ({
      hour: h.hour || 0,
      count: h.count || 0,
    })),
    avgSessionDuration: sessionStats?.avgDuration ? Number(sessionStats.avgDuration) : 0,
    returnRate: returnRateData?.returnRate || 0,
    completionRate: sessionStats?.completionRate || 0,
  };
}

# Analysis & Insights Specification

This document outlines the specifications for upgrading the Fictures analysis features from mock data to production-ready implementation with AI-powered insights, quality recommendations, and responsive mobile design.

## Table of Contents
1. [Current State Analysis](#current-state-analysis)
2. [Database Schema Updates](#database-schema-updates)
3. [Real Data Aggregation](#real-data-aggregation)
4. [Visualization Components](#visualization-components)
5. [AI-Powered Insights & Recommendations](#ai-powered-insights--recommendations)
6. [Quality Improvement Dashboard](#quality-improvement-dashboard)
7. [API Endpoints](#api-endpoints)
8. [Component Implementation](#component-implementation)
9. [Responsive Mobile Design](#responsive-mobile-design)
10. [Implementation Plan](#implementation-plan)

---

## Current State Analysis

### What Currently Exists

#### Database Analysis Support
- ✅ `userStats` table with comprehensive metrics
- ✅ `sceneEvaluations` table with AI-powered quality scores
- ✅ `aiInteractions` table tracking AI usage
- ✅ `stories` with `viewCount`, `rating`, `ratingCount`
- ✅ `communityPosts` with `likes`, `replies`, `views`

#### Analysis API Endpoints (Mock Data)
- ✅ GET `/api/analysis/stories` - Story performance metrics
- ✅ GET `/api/analysis/readers` - Reader engagement data
- ✅ GET `/api/publish/analysis` - Publication insights
- ✅ GET `/api/stats` - User statistics

#### Frontend Components
- ✅ Analysis dashboard page with layout
- ✅ Loading skeletons
- ✅ Data fetching hooks (SWR)
- ✅ Dark mode support

### What Needs Implementation

#### Critical Missing Features
- ❌ Real data aggregation (all APIs return mock data)
- ❌ Chart/visualization library (no charts installed)
- ❌ Event tracking system (page views, engagement)
- ❌ Reading session tracking
- ❌ Time-series data collection
- ❌ AI-powered quality insights
- ❌ Recommendation engine based on reader feedback
- ❌ Mobile-responsive analytics dashboard
- ❌ Advanced filtering and date range selection
- ❌ Export functionality (CSV, PDF reports)

---

## Database Schema Updates

### 1. New Table: `analytics_events`

**Purpose:** Track all user interactions for comprehensive analytics

```sql
CREATE TABLE analytics_events (
  id TEXT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL, -- page_view, story_view, chapter_read, comment, like, share, etc.
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous
  session_id TEXT NOT NULL,
  story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE CASCADE,
  scene_id TEXT REFERENCES scenes(id) ON DELETE CASCADE,
  post_id TEXT REFERENCES community_posts(id) ON DELETE CASCADE,
  metadata JSON DEFAULT '{}'::json, -- Additional event data
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_story ON analytics_events(story_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_events_user_timestamp ON analytics_events(user_id, timestamp);
```

**Event Types:**
- `page_view` - Any page visit
- `story_view` - Story landing page view
- `chapter_read_start` - User starts reading chapter
- `chapter_read_complete` - User finishes chapter
- `scene_read` - User reads a scene
- `comment_created` - User posts comment
- `comment_liked` - User likes comment
- `story_liked` - User likes story
- `chapter_liked` - User likes chapter
- `post_created` - Community post created
- `post_viewed` - Community post viewed
- `share` - Content shared
- `bookmark` - Content bookmarked

### 2. New Table: `reading_sessions`

**Purpose:** Track continuous reading sessions for engagement analysis

```sql
CREATE TABLE reading_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_seconds INTEGER, -- Calculated on end
  chapters_read INTEGER DEFAULT 0,
  scenes_read INTEGER DEFAULT 0,
  characters_read INTEGER DEFAULT 0,
  session_type VARCHAR(20) DEFAULT 'continuous', -- continuous, interrupted, partial
  device_type VARCHAR(20), -- mobile, tablet, desktop
  completed_story BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_reading_sessions_user ON reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_story ON reading_sessions(story_id);
CREATE INDEX idx_reading_sessions_start_time ON reading_sessions(start_time);
CREATE INDEX idx_reading_sessions_duration ON reading_sessions(duration_seconds);
```

### 3. New Table: `story_insights`

**Purpose:** Store AI-generated insights about story performance and quality

```sql
CREATE TABLE story_insights (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL, -- trend, recommendation, quality, engagement, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'info', -- info, warning, critical, success
  action_items JSON DEFAULT '[]'::json, -- Array of recommended actions
  metrics JSON DEFAULT '{}'::json, -- Supporting metrics
  ai_model VARCHAR(50), -- Model used for generation
  confidence_score DECIMAL(3,2), -- 0.00-1.00
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP -- Insights can expire
);

CREATE INDEX idx_story_insights_story ON story_insights(story_id);
CREATE INDEX idx_story_insights_type ON story_insights(insight_type);
CREATE INDEX idx_story_insights_created ON story_insights(created_at DESC);
CREATE INDEX idx_story_insights_unread ON story_insights(story_id, is_read);
```

**Insight Types:**
- `quality_improvement` - Writing quality suggestions
- `engagement_drop` - Engagement declining
- `reader_feedback` - Patterns in reader comments
- `pacing_issue` - Pacing problems detected
- `character_development` - Character arc suggestions
- `plot_consistency` - Plot hole detection
- `trending_up` - Story gaining traction
- `publishing_opportunity` - Optimal publish time
- `audience_mismatch` - Genre/audience alignment

### 4. New Table: `recommendation_feedback`

**Purpose:** Track whether users acted on AI recommendations

```sql
CREATE TABLE recommendation_feedback (
  id TEXT PRIMARY KEY,
  insight_id TEXT NOT NULL REFERENCES story_insights(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_taken VARCHAR(50) NOT NULL, -- accepted, rejected, implemented, ignored
  feedback_text TEXT,
  was_helpful BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_recommendation_feedback_insight ON recommendation_feedback(insight_id);
CREATE INDEX idx_recommendation_feedback_user ON recommendation_feedback(user_id);
```

### 5. Update Drizzle Schema

**Location:** `src/lib/db/schema.ts`

```typescript
// Event type enum
export const eventTypeEnum = pgEnum('event_type', [
  'page_view',
  'story_view',
  'chapter_read_start',
  'chapter_read_complete',
  'scene_read',
  'comment_created',
  'comment_liked',
  'story_liked',
  'chapter_liked',
  'post_created',
  'post_viewed',
  'share',
  'bookmark',
]);

// Session type enum
export const sessionTypeEnum = pgEnum('session_type', [
  'continuous',
  'interrupted',
  'partial',
]);

// Insight type enum
export const insightTypeEnum = pgEnum('insight_type', [
  'quality_improvement',
  'engagement_drop',
  'reader_feedback',
  'pacing_issue',
  'character_development',
  'plot_consistency',
  'trending_up',
  'publishing_opportunity',
  'audience_mismatch',
]);

// Analytics events table
export const analyticsEvents = pgTable('analytics_events', {
  id: text('id').primaryKey(),
  eventType: eventTypeEnum('event_type').notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: text('session_id').notNull(),
  storyId: text('story_id').references(() => stories.id, { onDelete: 'cascade' }),
  chapterId: text('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }),
  sceneId: text('scene_id').references(() => scenes.id, { onDelete: 'cascade' }),
  postId: text('post_id').references(() => communityPosts.id, { onDelete: 'cascade' }),
  metadata: json('metadata').$type<Record<string, unknown>>().default({}),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Reading sessions table
export const readingSessions = pgTable('reading_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  storyId: text('story_id').references(() => stories.id, { onDelete: 'cascade' }),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  durationSeconds: integer('duration_seconds'),
  chaptersRead: integer('chapters_read').default(0),
  scenesRead: integer('scenes_read').default(0),
  charactersRead: integer('characters_read').default(0),
  sessionType: sessionTypeEnum('session_type').default('continuous'),
  deviceType: varchar('device_type', { length: 20 }),
  completedStory: boolean('completed_story').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Story insights table
export const storyInsights = pgTable('story_insights', {
  id: text('id').primaryKey(),
  storyId: text('story_id').references(() => stories.id, { onDelete: 'cascade' }).notNull(),
  insightType: insightTypeEnum('insight_type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  severity: varchar('severity', { length: 20 }).default('info'),
  actionItems: json('action_items').$type<string[]>().default([]),
  metrics: json('metrics').$type<Record<string, unknown>>().default({}),
  aiModel: varchar('ai_model', { length: 50 }),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
  isRead: boolean('is_read').default(false),
  isDismissed: boolean('is_dismissed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
});

// Recommendation feedback table
export const recommendationFeedback = pgTable('recommendation_feedback', {
  id: text('id').primaryKey(),
  insightId: text('insight_id').references(() => storyInsights.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  actionTaken: varchar('action_taken', { length: 50 }).notNull(),
  feedbackText: text('feedback_text'),
  wasHelpful: boolean('was_helpful'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## Real Data Aggregation

### Analytics Calculation Service

**Location:** `src/lib/services/analytics.ts`

```typescript
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
import { eq, and, gte, lte, desc, sql, count, avg, sum } from 'drizzle-orm';

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
      start.setFullYear(2000); // Effectively all data
      break;
  }

  return { start, end };
}

export interface StoryAnalytics {
  totalReaders: number;
  readerGrowth: number; // Percentage change from previous period
  avgRating: number;
  totalComments: number;
  engagement: number; // Percentage (comments + likes / views * 100)
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

  // Get user's stories
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

  // Total unique readers (story views)
  const [readerStats] = await db
    .select({
      uniqueReaders: sql<number>`COUNT(DISTINCT ${analyticsEvents.userId})`,
      totalViews: count(analyticsEvents.id),
    })
    .from(analyticsEvents)
    .where(
      and(
        sql`${analyticsEvents.storyId} IN (${sql.join(storyIds.map(id => sql`${id}`), sql`, `)})`,
        eq(analyticsEvents.eventType, 'story_view'),
        gte(analyticsEvents.timestamp, start),
        lte(analyticsEvents.timestamp, end)
      )
    );

  // Previous period for growth calculation
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
        sql`${analyticsEvents.storyId} IN (${sql.join(storyIds.map(id => sql`${id}`), sql`, `)})`,
        eq(analyticsEvents.eventType, 'story_view'),
        gte(analyticsEvents.timestamp, previousPeriod.start),
        lte(analyticsEvents.timestamp, previousPeriod.end)
      )
    );

  const readerGrowth = previousReaderStats.uniqueReaders > 0
    ? ((readerStats.uniqueReaders - previousReaderStats.uniqueReaders) / previousReaderStats.uniqueReaders) * 100
    : 0;

  // Average rating across all stories
  const [ratingStats] = await db
    .select({
      avgRating: avg(stories.rating),
    })
    .from(stories)
    .where(
      and(
        eq(stories.authorId, userId),
        sql`${stories.id} IN (${sql.join(storyIds.map(id => sql`${id}`), sql`, `)})`
      )
    );

  // Total comments (community + reading)
  const [commentStats] = await db
    .select({
      communityComments: count(communityReplies.id),
      readingComments: count(comments.id),
    })
    .from(stories)
    .leftJoin(communityPosts, eq(stories.id, communityPosts.storyId))
    .leftJoin(communityReplies, eq(communityPosts.id, communityReplies.postId))
    .leftJoin(chapters, eq(stories.id, chapters.storyId))
    .leftJoin(scenes, eq(chapters.id, scenes.chapterId))
    .leftJoin(comments, eq(scenes.id, comments.sceneId))
    .where(
      and(
        eq(stories.authorId, userId),
        gte(communityReplies.createdAt, start),
        lte(communityReplies.createdAt, end)
      )
    );

  const totalComments = (commentStats.communityComments || 0) + (commentStats.readingComments || 0);

  // Calculate engagement rate
  const totalLikes = await db
    .select({ likes: sum(communityPosts.likes) })
    .from(communityPosts)
    .where(
      sql`${communityPosts.storyId} IN (${sql.join(storyIds.map(id => sql`${id}`), sql`, `)})`
    );

  const engagement = readerStats.totalViews > 0
    ? ((totalComments + (totalLikes[0]?.likes || 0)) / readerStats.totalViews) * 100
    : 0;

  // Get individual story performance
  const storiesData = await getStoryPerformanceData(storyIds, start, end);

  // Get trend data (daily aggregation)
  const trends = await getTrendData(storyIds, start, end);

  return {
    totalReaders: readerStats.uniqueReaders,
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
  const storyPerformance = await db
    .select({
      id: stories.id,
      title: stories.title,
      rating: stories.rating,
      views: sql<number>`COUNT(DISTINCT CASE WHEN ${analyticsEvents.eventType} = 'story_view' THEN ${analyticsEvents.id} END)`,
      comments: sql<number>`COUNT(${comments.id})`,
      reactions: sql<number>`SUM(${communityPosts.likes})`,
    })
    .from(stories)
    .leftJoin(analyticsEvents, eq(stories.id, analyticsEvents.storyId))
    .leftJoin(chapters, eq(stories.id, chapters.storyId))
    .leftJoin(scenes, eq(chapters.id, scenes.chapterId))
    .leftJoin(comments, eq(scenes.id, comments.sceneId))
    .leftJoin(communityPosts, eq(stories.id, communityPosts.storyId))
    .where(
      and(
        sql`${stories.id} IN (${sql.join(storyIds.map(id => sql`${id}`), sql`, `)})`,
        gte(analyticsEvents.timestamp, start),
        lte(analyticsEvents.timestamp, end)
      )
    )
    .groupBy(stories.id, stories.title, stories.rating);

  // Calculate trends (compare to previous period)
  return Promise.all(
    storyPerformance.map(async (story) => {
      // Get previous period views for trend calculation
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

      const trendPercentage = previousViews.views > 0
        ? ((story.views - previousViews.views) / previousViews.views) * 100
        : 0;

      const trend = trendPercentage > 5 ? 'up' : trendPercentage < -5 ? 'down' : 'stable';

      return {
        id: story.id,
        title: story.title,
        views: story.views,
        comments: story.comments || 0,
        reactions: story.reactions || 0,
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
  // Daily aggregation of views and engagement
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
        sql`${analyticsEvents.storyId} IN (${sql.join(storyIds.map(id => sql`${id}`), sql`, `)})`,
        gte(analyticsEvents.timestamp, start),
        lte(analyticsEvents.timestamp, end)
      )
    )
    .groupBy(sql`DATE(${analyticsEvents.timestamp})`)
    .orderBy(sql`DATE(${analyticsEvents.timestamp})`);

  return dailyData.map(day => ({
    date: day.date,
    views: day.views,
    engagement: day.views > 0 ? (day.engagements / day.views) * 100 : 0,
    newReaders: day.newReaders,
  }));
}

export interface ReaderAnalytics {
  topPosts: CommunityPost[];
  recentComments: Comment[];
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

  // Get user's stories
  const userStories = await db
    .select({ id: stories.id })
    .from(stories)
    .where(eq(stories.authorId, userId));

  const storyIds = userStories.map(s => s.id);

  // Top community posts
  const topPosts = await db
    .select()
    .from(communityPosts)
    .where(
      and(
        sql`${communityPosts.storyId} IN (${sql.join(storyIds.map(id => sql`${id}`), sql`, `)})`,
        gte(communityPosts.createdAt, start),
        lte(communityPosts.createdAt, end)
      )
    )
    .orderBy(desc(sql`${communityPosts.likes} + ${communityPosts.views}`))
    .limit(5);

  // Recent comments
  const recentComments = await db
    .select()
    .from(comments)
    .leftJoin(scenes, eq(comments.sceneId, scenes.id))
    .leftJoin(chapters, eq(scenes.chapterId, chapters.id))
    .where(
      and(
        sql`${chapters.storyId} IN (${sql.join(storyIds.map(id => sql`${id}`), sql`, `)})`,
        gte(comments.createdAt, start),
        lte(comments.createdAt, end)
      )
    )
    .orderBy(desc(comments.createdAt))
    .limit(10);

  // Demographics
  const [demographics] = await db
    .select({
      totalReaders: sql<number>`COUNT(DISTINCT ${analyticsEvents.userId})`,
      newReaders: sql<number>`COUNT(DISTINCT CASE WHEN ${analyticsEvents.eventType} = 'story_view' THEN ${analyticsEvents.userId} END)`,
    })
    .from(analyticsEvents)
    .where(
      and(
        sql`${analyticsEvents.storyId} IN (${sql.join(storyIds.map(id => sql`${id}`), sql`, `)})`,
        gte(analyticsEvents.timestamp, start),
        lte(analyticsEvents.timestamp, end)
      )
    );

  // Reading patterns
  const readingPatterns = await getReadingPatterns(storyIds, start, end);

  return {
    topPosts,
    recentComments: recentComments.map(c => c.comments),
    demographics: {
      totalReaders: demographics.totalReaders,
      returningReaders: demographics.totalReaders - demographics.newReaders,
      newReaders: demographics.newReaders,
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
  // Peak reading hours
  const hourlyData = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${analyticsEvents.timestamp})`,
      count: count(analyticsEvents.id),
    })
    .from(analyticsEvents)
    .where(
      and(
        sql`${analyticsEvents.storyId} IN (${sql.join(storyIds.map(id => sql`${id}`), sql`, `)})`,
        eq(analyticsEvents.eventType, 'chapter_read_start'),
        gte(analyticsEvents.timestamp, start),
        lte(analyticsEvents.timestamp, end)
      )
    )
    .groupBy(sql`EXTRACT(HOUR FROM ${analyticsEvents.timestamp})`)
    .orderBy(desc(count(analyticsEvents.id)))
    .limit(24);

  // Average session duration
  const [sessionStats] = await db
    .select({
      avgDuration: avg(readingSessions.durationSeconds),
      completionRate: sql<number>`(COUNT(CASE WHEN ${readingSessions.completedStory} = true THEN 1 END)::float / COUNT(*)) * 100`,
    })
    .from(readingSessions)
    .where(
      and(
        sql`${readingSessions.storyId} IN (${sql.join(storyIds.map(id => sql`${id}`), sql`, `)})`,
        gte(readingSessions.startTime, start),
        lte(readingSessions.startTime, end)
      )
    );

  // Return rate (readers who come back within 7 days)
  const [returnRate] = await db
    .select({
      returnRate: sql<number>`
        (COUNT(DISTINCT CASE
          WHEN EXISTS (
            SELECT 1 FROM ${analyticsEvents} ae2
            WHERE ae2.user_id = ${analyticsEvents.userId}
            AND ae2.timestamp > ${analyticsEvents.timestamp} + INTERVAL '7 days'
          ) THEN ${analyticsEvents.userId}
        END)::float / COUNT(DISTINCT ${analyticsEvents.userId})) * 100
      `,
    })
    .from(analyticsEvents)
    .where(
      and(
        sql`${analyticsEvents.storyId} IN (${sql.join(storyIds.map(id => sql`${id}`), sql`, `)})`,
        eq(analyticsEvents.eventType, 'story_view'),
        gte(analyticsEvents.timestamp, start),
        lte(analyticsEvents.timestamp, end)
      )
    );

  return {
    peakReadingHours: hourlyData.map(h => ({
      hour: h.hour,
      count: h.count,
    })),
    avgSessionDuration: sessionStats.avgDuration ? Number(sessionStats.avgDuration) : 0,
    returnRate: returnRate.returnRate || 0,
    completionRate: sessionStats.completionRate || 0,
  };
}
```

---

## Visualization Components

### Install Chart Library

```bash
pnpm add recharts
pnpm add date-fns
pnpm add @radix-ui/react-tooltip
```

### Chart Components

#### Line Chart Component
**Location:** `src/components/analytics/LineChart.tsx`

```typescript
'use client';

import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils/cn';

interface LineChartProps {
  data: any[];
  xKey: string;
  lines: {
    key: string;
    name: string;
    color: string;
    strokeWidth?: number;
  }[];
  height?: number;
  className?: string;
}

export function LineChart({ data, xKey, lines, height = 300, className }: LineChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
          <XAxis
            dataKey={xKey}
            stroke="rgb(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            stroke="rgb(var(--muted-foreground))"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(var(--popover))',
              border: '1px solid rgb(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'rgb(var(--popover-foreground))' }}
          />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

#### Bar Chart Component
**Location:** `src/components/analytics/BarChart.tsx`

```typescript
'use client';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils/cn';

interface BarChartProps {
  data: any[];
  xKey: string;
  bars: {
    key: string;
    name: string;
    color: string;
  }[];
  height?: number;
  className?: string;
}

export function BarChart({ data, xKey, bars, height = 300, className }: BarChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
          <XAxis
            dataKey={xKey}
            stroke="rgb(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            stroke="rgb(var(--muted-foreground))"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(var(--popover))',
              border: '1px solid rgb(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'rgb(var(--popover-foreground))' }}
          />
          <Legend />
          {bars.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color}
              radius={[8, 8, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

#### Metric Card Component
**Location:** `src/components/analytics/MetricCard.tsx`

```typescript
'use client';

import { cn } from '@/lib/utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  trend,
  description,
  className,
}: MetricCardProps) {
  const trendColor = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  };

  const trendIcon = {
    up: '↗',
    down: '↘',
    neutral: '→',
  };

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700',
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        {icon && (
          <div className="text-2xl">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </p>
        {change !== undefined && trend && (
          <span className={cn('text-sm font-medium', trendColor[trend])}>
            {trendIcon[trend]} {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {description}
        </p>
      )}
    </div>
  );
}
```

---

## AI-Powered Insights & Recommendations

### Insight Generation Service

**Location:** `src/lib/services/insights.ts`

```typescript
import { db } from '@/lib/db';
import { storyInsights, sceneEvaluations, analyticsEvents, communityReplies, comments } from '@/lib/db/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/YOUR_GATEWAY_ID/openai',
});

export interface GenerateInsightsParams {
  storyId: string;
  includeTypes?: string[];
}

export async function generateStoryInsights({
  storyId,
  includeTypes = ['quality_improvement', 'engagement_drop', 'reader_feedback'],
}: GenerateInsightsParams): Promise<void> {
  // Get story data
  const story = await db.query.stories.findFirst({
    where: eq(stories.id, storyId),
    with: {
      chapters: {
        with: {
          scenes: {
            with: {
              evaluations: true,
              comments: true,
            },
          },
        },
      },
    },
  });

  if (!story) throw new Error('Story not found');

  // Generate insights for each type
  for (const insightType of includeTypes) {
    switch (insightType) {
      case 'quality_improvement':
        await generateQualityInsights(story);
        break;
      case 'engagement_drop':
        await generateEngagementInsights(story);
        break;
      case 'reader_feedback':
        await generateReaderFeedbackInsights(story);
        break;
    }
  }
}

async function generateQualityInsights(story: any): Promise<void> {
  // Analyze scene evaluations
  const allEvaluations = story.chapters.flatMap((ch: any) =>
    ch.scenes.flatMap((sc: any) => sc.evaluations || [])
  );

  if (allEvaluations.length === 0) return;

  // Calculate average scores
  const avgScores = {
    plot: average(allEvaluations.map((e: any) => e.plotScore)),
    character: average(allEvaluations.map((e: any) => e.characterScore)),
    pacing: average(allEvaluations.map((e: any) => e.pacingScore)),
    prose: average(allEvaluations.map((e: any) => e.proseScore)),
    worldBuilding: average(allEvaluations.map((e: any) => e.worldBuildingScore)),
  };

  // Find lowest scoring category
  const lowestCategory = Object.entries(avgScores).reduce((min, [key, value]) =>
    value < min.value ? { category: key, value } : min,
    { category: '', value: 100 }
  );

  // Find scenes with lowest scores in that category
  const problemScenes = allEvaluations
    .filter((e: any) => e[`${lowestCategory.category}Score`] < 70)
    .sort((a: any, b: any) => a[`${lowestCategory.category}Score`] - b[`${lowestCategory.category}Score`])
    .slice(0, 3);

  // Generate AI-powered recommendations
  const recommendations = await generateRecommendations(
    story,
    lowestCategory.category,
    problemScenes
  );

  // Save insight
  await db.insert(storyInsights).values({
    id: nanoid(),
    storyId: story.id,
    insightType: 'quality_improvement',
    title: `Improve ${capitalizeFirst(lowestCategory.category)}`,
    description: `Your ${lowestCategory.category} scores average ${lowestCategory.value.toFixed(1)}/100. ${recommendations.summary}`,
    severity: lowestCategory.value < 60 ? 'warning' : 'info',
    actionItems: recommendations.actionItems,
    metrics: {
      category: lowestCategory.category,
      avgScore: lowestCategory.value,
      affectedScenes: problemScenes.length,
      scores: avgScores,
    },
    aiModel: 'gpt-4o-mini',
    confidenceScore: 0.85,
    createdAt: new Date(),
  });
}

async function generateEngagementInsights(story: any): Promise<void> {
  // Get engagement data for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const engagementData = await db
    .select({
      date: sql<string>`DATE(${analyticsEvents.timestamp})`,
      views: sql<number>`COUNT(DISTINCT CASE WHEN ${analyticsEvents.eventType} = 'chapter_read_start' THEN ${analyticsEvents.id} END)`,
      engagements: sql<number>`COUNT(CASE WHEN ${analyticsEvents.eventType} IN ('comment_created', 'story_liked') THEN ${analyticsEvents.id} END)`,
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.storyId, story.id),
        gte(analyticsEvents.timestamp, thirtyDaysAgo)
      )
    )
    .groupBy(sql`DATE(${analyticsEvents.timestamp})`)
    .orderBy(sql`DATE(${analyticsEvents.timestamp})`);

  // Detect declining trend (simple linear regression slope)
  const slope = calculateTrendSlope(engagementData.map(d => d.views));

  if (slope < -0.5) {
    // Significant decline detected
    const decline = Math.abs(slope * 100 / engagementData[0].views);

    await db.insert(storyInsights).values({
      id: nanoid(),
      storyId: story.id,
      insightType: 'engagement_drop',
      title: 'Engagement Declining',
      description: `Reader engagement has dropped by ${decline.toFixed(0)}% over the last 30 days. Consider publishing new content or engaging with your community.`,
      severity: decline > 30 ? 'warning' : 'info',
      actionItems: [
        'Publish a new chapter to re-engage readers',
        'Post a community update or behind-the-scenes content',
        'Respond to recent comments to boost interaction',
        'Share your story on social media',
      ],
      metrics: {
        declinePercentage: decline,
        currentViews: engagementData[engagementData.length - 1]?.views || 0,
        peakViews: Math.max(...engagementData.map(d => d.views)),
      },
      aiModel: 'rule-based',
      confidenceScore: 0.90,
      createdAt: new Date(),
    });
  }
}

async function generateReaderFeedbackInsights(story: any): Promise<void> {
  // Get all comments from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentComments = await db
    .select()
    .from(comments)
    .leftJoin(scenes, eq(comments.sceneId, scenes.id))
    .leftJoin(chapters, eq(scenes.chapterId, chapters.id))
    .where(
      and(
        eq(chapters.storyId, story.id),
        gte(comments.createdAt, thirtyDaysAgo)
      )
    )
    .limit(50);

  if (recentComments.length < 5) return;

  // Use AI to analyze comment sentiment and extract themes
  const analysis = await analyzeCommentSentiment(
    recentComments.map(c => c.comments.content)
  );

  await db.insert(storyInsights).values({
    id: nanoid(),
    storyId: story.id,
    insightType: 'reader_feedback',
    title: 'Reader Feedback Summary',
    description: analysis.summary,
    severity: 'info',
    actionItems: analysis.suggestions,
    metrics: {
      totalComments: recentComments.length,
      sentiment: analysis.sentiment,
      themes: analysis.themes,
    },
    aiModel: 'gpt-4o-mini',
    confidenceScore: 0.75,
    createdAt: new Date(),
  });
}

async function generateRecommendations(
  story: any,
  category: string,
  problemScenes: any[]
): Promise<{ summary: string; actionItems: string[] }> {
  const prompt = `As a writing coach, analyze this story's ${category} issues:

Story: ${story.title}
Problematic scenes: ${problemScenes.map((s: any) => s.sceneId).join(', ')}

Scene evaluations:
${JSON.stringify(problemScenes.map((s: any) => ({
  sceneId: s.sceneId,
  score: s[`${category}Score`],
  evaluation: s.evaluation?.categories?.[category],
})), null, 2)}

Provide:
1. A one-sentence summary of the issue
2. 3-5 specific, actionable recommendations to improve ${category}

Format as JSON:
{
  "summary": "string",
  "actionItems": ["string"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

async function analyzeCommentSentiment(comments: string[]): Promise<{
  summary: string;
  sentiment: { positive: number; neutral: number; negative: number };
  themes: string[];
  suggestions: string[];
}> {
  const prompt = `Analyze these reader comments for a fiction story:

${comments.join('\n\n')}

Provide:
1. Overall sentiment breakdown (percentage positive, neutral, negative)
2. Top 3-5 recurring themes readers mention
3. A one-sentence summary
4. 3-5 suggestions for the author based on feedback

Format as JSON:
{
  "summary": "string",
  "sentiment": { "positive": number, "neutral": number, "negative": number },
  "themes": ["string"],
  "suggestions": ["string"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// Utility functions
function average(numbers: number[]): number {
  return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
}

function calculateTrendSlope(data: number[]): number {
  const n = data.length;
  if (n < 2) return 0;

  const sumX = (n * (n - 1)) / 2;
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = data.reduce((sum, y, x) => sum + x * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

---

## Quality Improvement Dashboard

### InsightCard Component
**Location:** `src/components/analytics/InsightCard.tsx`

```typescript
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface InsightCardProps {
  insight: {
    id: string;
    insightType: string;
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical' | 'success';
    actionItems: string[];
    metrics: Record<string, unknown>;
    confidenceScore: number;
    createdAt: string;
  };
  onDismiss?: (id: string) => void;
  onFeedback?: (id: string, wasHelpful: boolean) => void;
}

export function InsightCard({ insight, onDismiss, onFeedback }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const severityConfig = {
    info: {
      icon: 'ℹ️',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-200',
    },
    warning: {
      icon: '⚠️',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-200',
    },
    critical: {
      icon: '🚨',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
    },
    success: {
      icon: '✅',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-800 dark:text-green-200',
    },
  };

  const config = severityConfig[insight.severity];

  const handleFeedback = async (wasHelpful: boolean) => {
    setFeedbackGiven(true);
    onFeedback?.(insight.id, wasHelpful);
    toast.success('Thank you for your feedback!');
  };

  const handleDismiss = () => {
    onDismiss?.(insight.id);
    toast.success('Insight dismissed');
  };

  return (
    <div
      className={cn(
        'rounded-lg border-2 p-6 transition-all',
        config.bgColor,
        config.borderColor
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className={cn('text-lg font-semibold', config.textColor)}>
              {insight.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {insight.description}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      {/* Confidence Score */}
      {insight.confidenceScore && (
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${insight.confidenceScore * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {(insight.confidenceScore * 100).toFixed(0)}% confidence
            </span>
          </div>
        </div>
      )}

      {/* Action Items */}
      {insight.actionItems.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            {isExpanded ? '▼' : '▶'} {insight.actionItems.length} recommended actions
          </button>

          {isExpanded && (
            <ul className="mt-3 space-y-2">
              {insight.actionItems.map((action, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Feedback */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {!feedbackGiven ? (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Was this helpful?</span>
            <button
              onClick={() => handleFeedback(true)}
              className="px-3 py-1 rounded bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30"
            >
              👍 Yes
            </button>
            <button
              onClick={() => handleFeedback(false)}
              className="px-3 py-1 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30"
            >
              👎 No
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Thanks for your feedback!
          </p>
        )}
      </div>
    </div>
  );
}
```

---

## API Endpoints

### Update Analytics APIs to Use Real Data

#### Update Story Analytics API
**Location:** `src/app/api/analytics/stories/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStoryAnalytics } from '@/lib/services/analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('range') || '30d') as '7d' | '30d' | '90d' | 'all';

    const analytics = await getStoryAnalytics(session.user.id, timeRange);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Failed to fetch story analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
```

#### Update Reader Analytics API
**Location:** `src/app/api/analytics/readers/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getReaderAnalytics } from '@/lib/services/analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('range') || '30d') as '7d' | '30d' | '90d' | 'all';

    const analytics = await getReaderAnalytics(session.user.id, timeRange);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Failed to fetch reader analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
```

#### New Insights API
**Location:** `src/app/api/analytics/insights/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { storyInsights, stories } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Get user's story IDs
    const userStories = await db
      .select({ id: stories.id })
      .from(stories)
      .where(eq(stories.authorId, session.user.id));

    const storyIds = userStories.map(s => s.id);

    // Build query
    let query = db
      .select()
      .from(storyInsights)
      .where(
        storyId
          ? eq(storyInsights.storyId, storyId)
          : sql`${storyInsights.storyId} IN (${sql.join(storyIds.map(id => sql`${id}`), sql`, `)})`
      );

    if (unreadOnly) {
      query = query.where(eq(storyInsights.isRead, false));
    }

    const insights = await query
      .orderBy(desc(storyInsights.createdAt))
      .limit(50);

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Failed to fetch insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
```

#### Generate Insights API
**Location:** `src/app/api/analytics/insights/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateStoryInsights } from '@/lib/services/insights';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { storyId, includeTypes } = await request.json();

    if (!storyId) {
      return NextResponse.json(
        { error: 'storyId required' },
        { status: 400 }
      );
    }

    // Verify story ownership
    const [story] = await db
      .select()
      .from(stories)
      .where(
        and(
          eq(stories.id, storyId),
          eq(stories.authorId, session.user.id)
        )
      )
      .limit(1);

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    await generateStoryInsights({ storyId, includeTypes });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to generate insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
```

---

## Component Implementation

### Updated Analytics Dashboard Page
**Location:** `src/app/analytics/page.tsx`

```typescript
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getStoryAnalytics, getReaderAnalytics } from '@/lib/services/analytics';
import { db } from '@/lib/db';
import { storyInsights, stories } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { MetricCard } from '@/components/analytics/MetricCard';
import { LineChart } from '@/components/analytics/LineChart';
import { BarChart } from '@/components/analytics/BarChart';
import { InsightCard } from '@/components/analytics/InsightCard';

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  // Check if user is writer or manager
  if (session.user.role !== 'writer' && session.user.role !== 'manager') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your story performance and reader engagement
          </p>
        </header>

        {/* Insights Section */}
        <Suspense fallback={<InsightsLoading />}>
          <InsightsSection userId={session.user.id} />
        </Suspense>

        {/* Key Metrics */}
        <Suspense fallback={<MetricsLoading />}>
          <MetricsSection userId={session.user.id} />
        </Suspense>

        {/* Trends Chart */}
        <Suspense fallback={<ChartsLoading />}>
          <TrendsSection userId={session.user.id} />
        </Suspense>

        {/* Story Performance */}
        <Suspense fallback={<TableLoading />}>
          <StoryPerformanceSection userId={session.user.id} />
        </Suspense>

        {/* Reader Analytics */}
        <Suspense fallback={<ReaderLoading />}>
          <ReaderSection userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}

async function InsightsSection({ userId }: { userId: string }) {
  // Get user's stories
  const userStories = await db
    .select({ id: stories.id })
    .from(stories)
    .where(eq(stories.authorId, userId));

  const storyIds = userStories.map(s => s.id);

  // Get recent unread insights
  const insights = await db
    .select()
    .from(storyInsights)
    .where(
      and(
        sql`${storyInsights.storyId} IN (${sql.join(storyIds.map(id => sql`${id}`), sql`, `)})`,
        eq(storyInsights.isRead, false)
      )
    )
    .orderBy(desc(storyInsights.createdAt))
    .limit(5);

  if (insights.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        AI Insights & Recommendations
      </h2>
      <div className="space-y-4">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </section>
  );
}

async function MetricsSection({ userId }: { userId: string }) {
  const analytics = await getStoryAnalytics(userId, '30d');

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Key Metrics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Readers"
          value={analytics.totalReaders.toLocaleString()}
          change={analytics.readerGrowth}
          trend={analytics.readerGrowth > 0 ? 'up' : analytics.readerGrowth < 0 ? 'down' : 'neutral'}
          icon="👥"
          description="Last 30 days"
        />
        <MetricCard
          title="Average Rating"
          value={analytics.avgRating.toFixed(1)}
          icon="⭐"
          description="Across all stories"
        />
        <MetricCard
          title="Comments"
          value={analytics.totalComments.toLocaleString()}
          icon="💬"
          description="Total comments received"
        />
        <MetricCard
          title="Engagement"
          value={`${analytics.engagement.toFixed(1)}%`}
          icon="📊"
          description="Reader interaction rate"
        />
      </div>
    </section>
  );
}

async function TrendsSection({ userId }: { userId: string }) {
  const analytics = await getStoryAnalytics(userId, '30d');

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Trends
      </h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <LineChart
          data={analytics.trends}
          xKey="date"
          lines={[
            { key: 'views', name: 'Views', color: '#3b82f6' },
            { key: 'engagement', name: 'Engagement %', color: '#10b981' },
            { key: 'newReaders', name: 'New Readers', color: '#8b5cf6' },
          ]}
          height={400}
        />
      </div>
    </section>
  );
}

async function StoryPerformanceSection({ userId }: { userId: string }) {
  const analytics = await getStoryAnalytics(userId, '30d');

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Story Performance
      </h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Story
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Views
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Comments
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Reactions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Trend
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {analytics.storiesData.map((story) => (
              <tr key={story.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                  {story.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  {story.views.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  {story.comments.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  {story.reactions.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  ⭐ {story.rating.toFixed(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex items-center gap-1 ${
                    story.trend === 'up'
                      ? 'text-green-600 dark:text-green-400'
                      : story.trend === 'down'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {story.trend === 'up' ? '↗' : story.trend === 'down' ? '↘' : '→'}
                    {Math.abs(story.trendPercentage).toFixed(0)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

async function ReaderSection({ userId }: { userId: string }) {
  const readerAnalytics = await getReaderAnalytics(userId, '30d');

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Reader Insights
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demographics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Reader Demographics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Readers</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {readerAnalytics.demographics.totalReaders.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">New Readers</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {readerAnalytics.demographics.newReaders.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Returning Readers</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {readerAnalytics.demographics.returningReaders.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Reading Patterns */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Reading Patterns
          </h3>
          <BarChart
            data={readerAnalytics.readingPatterns.peakReadingHours.slice(0, 10)}
            xKey="hour"
            bars={[
              { key: 'count', name: 'Readers', color: '#3b82f6' },
            ]}
            height={250}
          />
        </div>
      </div>
    </section>
  );
}

// Loading skeletons
function InsightsLoading() {
  return (
    <div className="mb-8 space-y-4">
      {[1, 2].map(i => (
        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-40 animate-pulse" />
      ))}
    </div>
  );
}

function MetricsLoading() {
  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32 animate-pulse" />
      ))}
    </div>
  );
}

function ChartsLoading() {
  return (
    <div className="mb-8">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-96 animate-pulse" />
    </div>
  );
}

function TableLoading() {
  return (
    <div className="mb-8">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 animate-pulse" />
    </div>
  );
}

function ReaderLoading() {
  return (
    <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 animate-pulse" />
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 animate-pulse" />
    </div>
  );
}
```

---

## Responsive Mobile Design

### Mobile Analytics Dashboard

**Layout Adaptations:**

**Desktop (≥ 1024px):**
- 4-column metrics grid
- Full-width charts
- Side-by-side sections

**Tablet (768px - 1023px):**
- 2-column metrics grid
- Full-width charts
- Stacked sections

**Mobile (< 768px):**
- 1-column layout
- Scrollable horizontal charts
- Collapsible sections
- Bottom tab navigation

### Mobile-Specific Components

#### Mobile Analytics Navigation
**Location:** `src/components/analytics/MobileAnalyticsNav.tsx`

```typescript
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

export function MobileAnalyticsNav() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'stories', label: 'Stories', icon: '📚' },
    { id: 'readers', label: 'Readers', icon: '👥' },
    { id: 'insights', label: 'Insights', icon: '💡' },
  ];

  return (
    <nav className="lg:hidden sticky top-16 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 min-w-[80px] py-3 px-4 text-sm font-medium transition-colors',
              'whitespace-nowrap',
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            )}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          </button>
        ))}
      </div>
    </nav>
  );
}
```

#### Collapsible Section Component
**Location:** `src/components/analytics/CollapsibleSection.tsx`

```typescript
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn('mb-6', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-2"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <span className="text-gray-500">
          {isOpen ? '▼' : '▶'}
        </span>
      </button>

      {isOpen && (
        <div className="animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
```

### Mobile Optimizations

```css
/* Mobile-specific styles */
@media (max-width: 768px) {
  /* Metrics cards stack vertically */
  .metrics-grid {
    @apply grid-cols-1 gap-3;
  }

  /* Charts become scrollable horizontally */
  .chart-container {
    @apply overflow-x-auto;
    min-width: 600px;
  }

  /* Tables get horizontal scroll */
  .table-container {
    @apply overflow-x-auto;
  }

  /* Reduce padding for more content */
  .analytics-section {
    @apply px-4 py-3;
  }

  /* Smaller fonts for mobile */
  .metric-value {
    @apply text-2xl;
  }

  /* Touch-friendly buttons */
  .action-button {
    @apply min-h-[44px] min-w-[44px];
  }
}
```

---

## Implementation Plan

### Phase 1: Database & Event Tracking (Week 1)
**Tasks:**
1. Run database migrations for new analytics tables
2. Implement event tracking system
3. Create analytics event API endpoint
4. Add event tracking to all user interactions
5. Implement reading session tracking
6. Test event collection

**Deliverables:**
- All analytics tables created
- Event tracking functional
- Session tracking working

### Phase 2: Real Data Aggregation (Week 2)
**Tasks:**
1. Implement analytics service functions
2. Update story analytics API to use real data
3. Update reader analytics API to use real data
4. Test data accuracy
5. Performance optimization

**Deliverables:**
- Real analytics data flowing
- All APIs returning real data
- Performance benchmarks met

### Phase 3: Visualization & Charts (Week 3)
**Tasks:**
1. Install Recharts library
2. Implement chart components (Line, Bar, Pie)
3. Implement metric card component
4. Update analytics dashboard with charts
5. Add interactive filtering
6. Mobile chart optimizations

**Deliverables:**
- Beautiful chart visualizations
- Interactive dashboard
- Mobile-responsive charts

### Phase 4: AI Insights & Recommendations (Week 4)
**Tasks:**
1. Implement insight generation service
2. Create quality improvement insights
3. Create engagement insights
4. Create reader feedback insights
5. Implement insight display components
6. Add feedback mechanism
7. Test AI recommendations

**Deliverables:**
- AI-powered insights generated
- Recommendation engine working
- Feedback loop implemented

### Phase 5: Mobile & Polish (Week 5)
**Tasks:**
1. Implement mobile navigation
2. Create collapsible sections
3. Optimize for touch interactions
4. Performance testing on mobile
5. Cross-browser testing
6. Bug fixes
7. Documentation

**Deliverables:**
- Fully responsive mobile design
- Production-ready analytics
- Complete documentation

---

## Success Metrics

### Data Quality Metrics
- **Event Accuracy:** 99.9% of events tracked correctly
- **Data Latency:** < 5 minutes from event to dashboard
- **Query Performance:** < 500ms for analytics queries

### User Engagement Metrics
- **Dashboard Usage:** % of writers visiting analytics weekly
- **Insight Action Rate:** % of insights acted upon
- **Recommendation Acceptance:** % of AI suggestions implemented
- **Session Duration:** Average time spent in analytics

### Technical Metrics
- **Page Load Time:** < 3s on mobile, < 2s on desktop
- **Chart Render Time:** < 500ms
- **API Response Time:** < 1s (p95)
- **Error Rate:** < 0.1%

---

## Future Enhancements

### Advanced Analytics
- **Predictive Analytics:** ML models for trend prediction
- **A/B Testing:** Chapter/title variant testing
- **Cohort Analysis:** Reader retention analysis
- **Funnel Analysis:** Reader journey mapping
- **Sentiment Analysis:** Deep comment sentiment tracking

### Integration Features
- **Export Capabilities:** CSV/PDF report generation
- **Email Reports:** Automated weekly/monthly summaries
- **Webhooks:** Real-time analytics webhooks
- **Third-Party Analytics:** Google Analytics integration
- **Social Media Tracking:** Share tracking across platforms

### Quality Improvement
- **Writing Coach:** AI-powered writing improvement suggestions
- **Style Analysis:** Consistency and voice analysis
- **Pacing Heatmaps:** Visual pacing analysis per chapter
- **Character Arc Tracking:** Character development insights
- **Plot Hole Detection:** AI-powered plot consistency checking

---

## References

### Technical Documentation
- [Recharts Documentation](https://recharts.org/en-US/)
- [PostgreSQL Analytics Best Practices](https://www.postgresql.org/docs/current/tutorial-agg.html)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Drizzle ORM Aggregations](https://orm.drizzle.team/docs/select#aggregations-helpers)

### Analytics Best Practices
- [Google Analytics 4 Event Tracking](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [Mixpanel Analytics Guide](https://mixpanel.com/blog/product-analytics-best-practices/)
- [Amplitude Data Taxonomy](https://www.docs.developers.amplitude.com/analytics/what-is-amplitude/)

### AI & Recommendations
- [Content Recommendation Systems](https://developers.google.com/machine-learning/recommendation)
- [Sentiment Analysis Best Practices](https://monkeylearn.com/sentiment-analysis/)
- [Writing Quality Metrics](https://www.grammarly.com/blog/studio-analytics/)

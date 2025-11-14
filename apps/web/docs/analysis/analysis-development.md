# Analysis & Insights Development Guide

This document provides the **how** of implementing the Fictures analysis system - API specifications, database setup, service implementations, UI components, and deployment instructions.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Database Setup](#database-setup)
3. [API Endpoints](#api-endpoints)
4. [Services](#services)
5. [UI Components](#ui-components)
6. [Event Tracking](#event-tracking)
7. [Daily Data Aggregation](#daily-data-aggregation)
8. [Visualization](#visualization)
9. [Deployment](#deployment)

---

## Quick Start

### Prerequisites
- PostgreSQL database (Neon)
- Next.js 15 with App Router
- Drizzle ORM configured
- Recharts for visualizations

### Installation

```bash
# Install dependencies
pnpm add recharts date-fns @radix-ui/react-tooltip

# Run database migrations
dotenv --file .env.local run pnpm db:migrate

# Start development server
dotenv --file .env.local run pnpm dev
```

### Directory Structure

```
src/
├── app/
│   └── analysis/
│       ├── page.tsx                    # Landing page with story cards
│       ├── [storyId]/
│       │   └── page.tsx                # Story detail analytics
│       └── api/
│           ├── stories/route.ts        # Story analytics API
│           ├── daily/route.ts          # Daily metrics API
│           └── insights/
│               ├── route.ts            # Get insights
│               └── generate/route.ts   # Generate insights
├── components/
│   └── analysis/
│       ├── AnalyticsLandingPage.tsx    # Story cards grid
│       ├── AnalyticsStoryCard.tsx      # Individual story card
│       ├── StoryAnalyticsDashboard.tsx # Detail page dashboard
│       ├── MetricCard.tsx              # Metric display card
│       ├── LineChart.tsx               # Time-series line chart
│       ├── BarChart.tsx                # Bar chart
│       └── InsightCard.tsx             # AI insight card
└── lib/
    └── services/
        ├── analytics.ts                # Analytics service
        ├── event-tracker.ts            # Event tracking
        └── insights.ts                 # AI insights generation
```

---

## Database Setup

### 1. Update Drizzle Schema

**Location**: `drizzle/schema.ts`

```typescript
import { pgTable, text, varchar, timestamp, integer, boolean, json, decimal, pgEnum } from 'drizzle-orm/pg-core';

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
export const analysisEvents = pgTable('analysis_events', {
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

### 2. Run Migrations

```bash
# Generate migration
dotenv --file .env.local run pnpm db:generate

# Apply migration
dotenv --file .env.local run pnpm db:migrate
```

---

## API Endpoints

### 1. Get Stories for Analytics Landing Page

**Endpoint**: `GET /analysis/api/stories`

**Purpose**: Fetch all stories with basic analytics for the landing page card grid.

**Location**: `src/app/analysis/api/stories/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stories, analysisEvents } from '@/lib/db/schema';
import { eq, and, gte, desc, count, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch stories with analytics
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
        // Analytics (last 30 days)
        views: sql<number>`COUNT(DISTINCT CASE WHEN ${analysisEvents.eventType} = 'story_view' THEN ${analysisEvents.id} END)`,
        readers: sql<number>`COUNT(DISTINCT ${analysisEvents.userId})`,
        engagement: sql<number>`COUNT(CASE WHEN ${analysisEvents.eventType} IN ('comment_created', 'story_liked', 'share') THEN ${analysisEvents.id} END)`,
      })
      .from(stories)
      .leftJoin(
        analysisEvents,
        and(
          eq(stories.id, analysisEvents.storyId),
          gte(analysisEvents.timestamp, thirtyDaysAgo)
        )
      )
      .where(eq(stories.authorId, session.user.id))
      .groupBy(stories.id)
      .orderBy(desc(stories.createdAt));

    return NextResponse.json({ stories: userStories });
  } catch (error) {
    console.error('Failed to fetch stories for analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}
```

### 2. Get Daily Metrics for Story

**Endpoint**: `GET /analysis/api/daily?storyId={id}&range={7d|30d|90d}`

**Purpose**: Fetch daily aggregated metrics for time-series charts.

**Location**: `src/app/analysis/api/daily/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stories, analysisEvents, readingSessions } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, count, avg, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');
    const range = (searchParams.get('range') || '30d') as '7d' | '30d' | '90d';

    if (!storyId) {
      return NextResponse.json({ error: 'storyId required' }, { status: 400 });
    }

    // Verify ownership
    const story = await db.query.stories.findFirst({
      where: and(
        eq(stories.id, storyId),
        eq(stories.authorId, session.user.id)
      ),
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Calculate date range
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
    }

    // Get daily metrics
    const dailyData = await db
      .select({
        date: sql<string>`DATE(${analysisEvents.timestamp})`,
        views: count(sql`DISTINCT CASE WHEN ${analysisEvents.eventType} = 'story_view' THEN ${analysisEvents.id} END`),
        readers: count(sql`DISTINCT ${analysisEvents.userId}`),
        engagement: count(sql`CASE WHEN ${analysisEvents.eventType} IN ('comment_created', 'story_liked', 'share') THEN ${analysisEvents.id} END`),
      })
      .from(analysisEvents)
      .where(
        and(
          eq(analysisEvents.storyId, storyId),
          gte(analysisEvents.timestamp, start),
          lte(analysisEvents.timestamp, end)
        )
      )
      .groupBy(sql`DATE(${analysisEvents.timestamp})`)
      .orderBy(sql`DATE(${analysisEvents.timestamp})`);

    // Get session metrics
    const sessionData = await db
      .select({
        date: sql<string>`DATE(${readingSessions.startTime})`,
        avgDuration: avg(readingSessions.durationSeconds),
        completions: count(sql`CASE WHEN ${readingSessions.completedStory} = true THEN 1 END`),
      })
      .from(readingSessions)
      .where(
        and(
          eq(readingSessions.storyId, storyId),
          gte(readingSessions.startTime, start),
          lte(readingSessions.startTime, end)
        )
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

    return NextResponse.json({ data: mergedData });
  } catch (error) {
    console.error('Failed to fetch daily metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
```

### 3. Get Story Analytics Summary

**Endpoint**: `GET /analysis/api/stories/{storyId}`

**Purpose**: Get comprehensive analytics summary for a specific story.

**Location**: `src/app/analysis/api/stories/[storyId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStoryAnalytics } from '@/lib/services/analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') || '30d') as '7d' | '30d' | '90d';

    const analytics = await getStoryAnalytics(params.storyId, session.user.id, range);

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

---

## Services

### Analytics Service

**Location**: `src/lib/services/analytics.ts`

```typescript
import { db } from '@/lib/db';
import {
  stories,
  chapters,
  scenes,
  analysisEvents,
  readingSessions,
  sceneEvaluations,
  users,
} from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql, count, avg, sum } from 'drizzle-orm';

interface TimeRange {
  start: Date;
  end: Date;
}

function getTimeRange(range: '7d' | '30d' | '90d'): TimeRange {
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
  }

  return { start, end };
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
    rate: number; // (comments + likes + shares) / views * 100
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
    viewsChange: number; // % change vs previous period
    readersChange: number;
    engagementChange: number;
  };
}

export async function getStoryAnalytics(
  storyId: string,
  userId: string,
  timeRange: '7d' | '30d' | '90d' = '30d'
): Promise<StoryAnalytics> {
  const { start, end } = getTimeRange(timeRange);

  // Verify ownership
  const story = await db.query.stories.findFirst({
    where: and(eq(stories.id, storyId), eq(stories.authorId, userId)),
  });

  if (!story) {
    throw new Error('Story not found');
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
        eq(analysisEvents.eventType, 'story_view'),
        gte(analysisEvents.timestamp, start),
        lte(analysisEvents.timestamp, end)
      )
    );

  // Get engagement stats
  const [engagementStats] = await db
    .select({
      comments: count(sql`CASE WHEN ${analysisEvents.eventType} = 'comment_created' THEN 1 END`),
      likes: count(sql`CASE WHEN ${analysisEvents.eventType} = 'story_liked' THEN 1 END`),
      shares: count(sql`CASE WHEN ${analysisEvents.eventType} = 'share' THEN 1 END`),
    })
    .from(analysisEvents)
    .where(
      and(
        eq(analysisEvents.storyId, storyId),
        gte(analysisEvents.timestamp, start),
        lte(analysisEvents.timestamp, end)
      )
    );

  const engagementRate =
    viewStats.totalViews > 0
      ? ((engagementStats.comments + engagementStats.likes + engagementStats.shares) /
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
        gte(readingSessions.startTime, start),
        lte(readingSessions.startTime, end)
      )
    );

  // Calculate return rate
  const [returnRateData] = await db
    .select({
      returnRate: sql<number>`
        (COUNT(DISTINCT CASE
          WHEN EXISTS (
            SELECT 1 FROM ${analysisEvents} ae2
            WHERE ae2.user_id = ${analysisEvents.userId}
            AND ae2.timestamp > ${analysisEvents.timestamp} + INTERVAL '7 days'
            AND ae2.story_id = ${storyId}
          ) THEN ${analysisEvents.userId}
        END)::float / NULLIF(COUNT(DISTINCT ${analysisEvents.userId}), 0)) * 100
      `,
    })
    .from(analysisEvents)
    .where(
      and(
        eq(analysisEvents.storyId, storyId),
        eq(analysisEvents.eventType, 'story_view'),
        gte(analysisEvents.timestamp, start),
        lte(analysisEvents.timestamp, end)
      )
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
  const previousPeriod = getTimeRange(timeRange);
  previousPeriod.end = start;
  previousPeriod.start = new Date(start);
  if (timeRange === '7d') previousPeriod.start.setDate(previousPeriod.start.getDate() - 7);
  else if (timeRange === '30d')
    previousPeriod.start.setDate(previousPeriod.start.getDate() - 30);
  else if (timeRange === '90d')
    previousPeriod.start.setDate(previousPeriod.start.getDate() - 90);

  const [previousStats] = await db
    .select({
      views: count(analysisEvents.id),
      readers: sql<number>`COUNT(DISTINCT ${analysisEvents.userId})`,
      engagement: count(
        sql`CASE WHEN ${analysisEvents.eventType} IN ('comment_created', 'story_liked', 'share') THEN 1 END`
      ),
    })
    .from(analysisEvents)
    .where(
      and(
        eq(analysisEvents.storyId, storyId),
        gte(analysisEvents.timestamp, previousPeriod.start),
        lte(analysisEvents.timestamp, previousPeriod.end)
      )
    );

  const viewsChange =
    previousStats.views > 0
      ? ((viewStats.totalViews - previousStats.views) / previousStats.views) * 100
      : 0;

  const readersChange =
    previousStats.readers > 0
      ? ((viewStats.uniqueReaders - previousStats.readers) / previousStats.readers) * 100
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
```

### Event Tracking Service

**Location**: `src/lib/services/event-tracker.ts`

```typescript
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { analysisEvents } from '@/lib/db/schema';

interface TrackEventParams {
  eventType: string;
  userId?: string | null;
  storyId?: string;
  chapterId?: string;
  sceneId?: string;
  postId?: string;
  metadata?: Record<string, unknown>;
}

export async function trackEvent({
  eventType,
  userId,
  storyId,
  chapterId,
  sceneId,
  postId,
  metadata = {},
}: TrackEventParams) {
  try {
    // Get or create session ID (client-side would provide this)
    const sessionId = metadata.sessionId as string || nanoid();

    await db.insert(analysisEvents).values({
      id: nanoid(),
      eventType: eventType as any,
      userId: userId || null,
      sessionId,
      storyId: storyId || null,
      chapterId: chapterId || null,
      sceneId: sceneId || null,
      postId: postId || null,
      metadata,
      timestamp: new Date(),
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to track event:', error);
    // Don't throw - analytics failures should not break user experience
  }
}
```

---

## UI Components

### Analytics Landing Page

**Location**: `src/app/analysis/page.tsx`

```typescript
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasAnyRole } from '@/lib/auth/permissions';
import { MainLayout } from '@/components/layout';
import { AnalyticsLandingPage } from '@/components/analysis/AnalyticsLandingPage';

export default async function AnalysisPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (!hasAnyRole(session, ['writer', 'manager'])) {
    redirect('/');
  }

  return (
    <MainLayout>
      <AnalyticsLandingPage />
    </MainLayout>
  );
}
```

### Analytics Story Card Component

**Location**: `src/components/analysis/AnalyticsStoryCard.tsx`

```typescript
"use client";

import Link from "next/link";
import { Card, CardContent, StoryImage, Badge } from "@/components/ui";
import { TrendingUp, TrendingDown, Minus, Eye, Users, MessageCircle } from "lucide-react";

interface AnalyticsStoryCardProps {
  id: string;
  title: string;
  genre: string;
  imageUrl?: string | null;
  imageVariants?: any;
  views: number;
  readers: number;
  engagement: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export function AnalyticsStoryCard({
  id,
  title,
  genre,
  imageUrl,
  imageVariants,
  views,
  readers,
  engagement,
  trend,
  trendPercentage,
}: AnalyticsStoryCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <Link href={`/analysis/${id}`} className="block h-full">
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer overflow-hidden">
        <CardContent className="p-0 space-y-0">
          {/* Story Image */}
          {imageUrl && (
            <div className="relative w-full aspect-video bg-[rgb(var(--color-muted))]">
              <StoryImage
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              {/* Trend Badge Overlay */}
              <div className="absolute top-2 right-2">
                <Badge
                  variant={trend === 'up' ? 'success' : trend === 'down' ? 'destructive' : 'default'}
                  className="flex items-center gap-1"
                >
                  {getTrendIcon()}
                  {Math.abs(trendPercentage).toFixed(0)}%
                </Badge>
              </div>
            </div>
          )}

          <div className="p-6 space-y-4">
            {/* Title and Genre */}
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-[rgb(var(--color-foreground))]">
                📊 {title}
              </h3>
              <p className="text-sm text-[rgb(var(--color-muted-foreground))]">{genre}</p>
            </div>

            {/* Analytics Stats Grid */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[rgb(var(--color-muted-foreground))]">
                  <Eye className="w-4 h-4" />
                  <span>Views</span>
                </div>
                <p className="text-lg font-semibold text-[rgb(var(--color-foreground))]">
                  {formatNumber(views)}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[rgb(var(--color-muted-foreground))]">
                  <Users className="w-4 h-4" />
                  <span>Readers</span>
                </div>
                <p className="text-lg font-semibold text-[rgb(var(--color-foreground))]">
                  {formatNumber(readers)}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[rgb(var(--color-muted-foreground))]">
                  <MessageCircle className="w-4 h-4" />
                  <span>Actions</span>
                </div>
                <p className="text-lg font-semibold text-[rgb(var(--color-foreground))]">
                  {formatNumber(engagement)}
                </p>
              </div>
            </div>

            {/* Trend Summary */}
            <div className={`flex items-center gap-2 text-sm ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>
                {trend === 'up' && 'Growing'}
                {trend === 'down' && 'Declining'}
                {trend === 'stable' && 'Stable'} - Last 30 days
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

---

## Event Tracking

### Client-Side Event Tracker

**Location**: `src/components/analysis/EventTracker.tsx`

```typescript
"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface EventTrackerProps {
  eventType: string;
  storyId?: string;
  chapterId?: string;
  sceneId?: string;
  metadata?: Record<string, unknown>;
}

export function EventTracker({
  eventType,
  storyId,
  chapterId,
  sceneId,
  metadata = {},
}: EventTrackerProps) {
  const { data: session } = useSession();

  useEffect(() => {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }

    // Track event
    fetch('/analysis/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        userId: session?.user?.id,
        storyId,
        chapterId,
        sceneId,
        metadata: {
          ...metadata,
          sessionId,
          deviceType: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          screenWidth: window.innerWidth,
          timestamp: new Date().toISOString(),
        },
      }),
    }).catch((error) => {
      console.error('Failed to track event:', error);
    });
  }, [eventType, storyId, chapterId, sceneId, session, metadata]);

  return null; // This component doesn't render anything
}
```

---

## Daily Data Aggregation

### Aggregation Cron Job

**Location**: `src/app/api/cron/analytics-daily/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { analysisEvents, sql } from '@/lib/db/schema';
import { eq, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    // Aggregate yesterday's data (example - expand as needed)
    const dailyMetrics = await db
      .select({
        storyId: analysisEvents.storyId,
        date: sql<string>`DATE(${analysisEvents.timestamp})`,
        views: sql<number>`COUNT(DISTINCT CASE WHEN event_type = 'story_view' THEN id END)`,
        readers: sql<number>`COUNT(DISTINCT user_id)`,
        engagement: sql<number>`COUNT(CASE WHEN event_type IN ('comment_created', 'story_liked', 'share') THEN 1 END)`,
      })
      .from(analysisEvents)
      .where(
        and(
          gte(analysisEvents.timestamp, yesterday),
          lte(analysisEvents.timestamp, endOfYesterday)
        )
      )
      .groupBy(analysisEvents.storyId, sql`DATE(${analysisEvents.timestamp})`);

    // Store in a separate daily_metrics table (create this table if needed)
    // await db.insert(dailyMetrics).values(dailyMetrics);

    console.log(`Aggregated ${dailyMetrics.length} daily metrics`);

    return NextResponse.json({
      success: true,
      metricsAggregated: dailyMetrics.length,
      date: yesterday.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Failed to aggregate daily metrics:', error);
    return NextResponse.json(
      { error: 'Failed to aggregate metrics' },
      { status: 500 }
    );
  }
}
```

### Vercel Cron Configuration

**Location**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/analytics-daily",
      "schedule": "0 1 * * *"
    }
  ]
}
```

---

## Visualization

### Line Chart Component

**Location**: `src/components/analysis/LineChart.tsx`

```typescript
"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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
}

export function LineChart({ data, xKey, lines, height = 300 }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
        <XAxis
          dataKey={xKey}
          stroke="rgb(var(--color-muted-foreground))"
          fontSize={12}
        />
        <YAxis stroke="rgb(var(--color-muted-foreground))" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgb(var(--color-popover))',
            border: '1px solid rgb(var(--color-border))',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'rgb(var(--color-popover-foreground))' }}
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
  );
}
```

---

## Deployment

### Environment Variables

Add to `.env.local`:

```bash
# Analytics Cron Job Secret
CRON_SECRET=your-secure-random-secret
```

### Database Migration

```bash
# Generate migration
dotenv --file .env.local run pnpm db:generate

# Run migration
dotenv --file .env.local run pnpm db:migrate
```

### Deploy to Vercel

```bash
# Set cron secret
vercel env add CRON_SECRET production

# Deploy
vercel --prod
```

---

## Testing

### Test Event Tracking

```typescript
// Test script: test-scripts/test-event-tracking.ts
import { trackEvent } from '@/lib/services/event-tracker';

async function testTracking() {
  await trackEvent({
    eventType: 'story_view',
    userId: 'test-user-id',
    storyId: 'test-story-id',
    metadata: {
      deviceType: 'desktop',
      referrer: 'community',
    },
  });

  console.log('Event tracked successfully');
}

testTracking();
```

---

**Last Updated**: 2025-11-04
**Status**: 🚧 Implementation in progress

---
title: Publishing & Scheduling Development Guide
description: Implementation guide for weekly scene-by-scene publishing system
status: 🏗️ In Progress
---

# Publishing & Scheduling Development Guide

Complete implementation guide for the weekly scene-by-scene publishing system with Vercel cron job automation.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Implementation](#database-implementation)
3. [Vercel Cron Job Setup](#vercel-cron-job-setup)
4. [API Endpoints](#api-endpoints)
5. [Services & Utilities](#services--utilities)
6. [UI Components](#ui-components)
7. [Implementation Phases](#implementation-phases)
8. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Publishing System                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  USER INTERACTION                                                     │
│  ┌─────────────────┐                                                 │
│  │  Create Schedule │                                                │
│  │  (UI Form)       │                                                │
│  └────────┬─────────┘                                                │
│           │                                                           │
│           ▼                                                           │
│  ┌──────────────────────────────────────────────┐                   │
│  │  POST /publish/api/schedules                  │                   │
│  │  - Validate input                             │                   │
│  │  - Create publishingSchedules record          │                   │
│  │  - Generate scheduledPublications queue       │                   │
│  │  - Return schedule ID + preview              │                   │
│  └──────────────────┬───────────────────────────┘                   │
│                     │                                                │
│                     ▼                                                │
│  ┌──────────────────────────────────────────────┐                   │
│  │  DATABASE                                     │                   │
│  │  - publishingSchedules                        │                   │
│  │  - scheduledPublications (queue)              │                   │
│  │  - scenes (with publishing fields)            │                   │
│  └──────────────────┬───────────────────────────┘                   │
│                     │                                                │
│           ┌─────────┴─────────┐                                      │
│           │                   │                                      │
│           ▼                   ▼                                      │
│  ┌─────────────────┐  ┌──────────────────────┐                     │
│  │  Timeline View  │  │  Vercel Cron Job     │                     │
│  │  (Calendar UI)  │  │  (Daily 8:00 AM UTC) │                     │
│  └─────────────────┘  └──────────┬───────────┘                     │
│                                   │                                  │
│                                   ▼                                  │
│                     ┌──────────────────────────────┐                │
│                     │  GET /publish/api/cron       │                │
│                     │  - Query pending publications │                │
│                     │  - Check if due now          │                │
│                     │  - Publish scenes            │                │
│                     │  - Update queue status       │                │
│                     │  - Send notifications        │                │
│                     └──────────┬───────────────────┘                │
│                                │                                     │
│                                ▼                                     │
│                     ┌──────────────────────────────┐                │
│                     │  POST /publish/api/scenes/[id]│                │
│                     │  - Update scene.publishedAt  │                │
│                     │  - Set scene.visibility       │                │
│                     │  - Log publishing history    │                │
│                     └──────────────────────────────┘                │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 15 + React + Tailwind CSS v4
- **Backend**: Next.js App Router API routes
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Automation**: Vercel Cron Jobs (daily execution)
- **Authentication**: NextAuth.js v5
- **Validation**: Zod schemas

---

## Database Implementation

### 1. Publishing Schedules Table

Already exists in `drizzle/schema.ts`. No changes needed.

```typescript
export const publishingSchedules = pgTable('publishing_schedules', {
  id: text().primaryKey(),
  storyId: text('story_id').references(() => stories.id, { onDelete: 'cascade' }).notNull(),
  chapterId: text('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').references(() => users.id).notNull(),

  name: varchar({ length: 255 }).notNull(),
  description: text(),
  scheduleType: scheduleType().notNull(),  // 'daily' | 'weekly' | 'custom' | 'one-time'

  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  publishTime: time('publish_time').default('09:00:00').notNull(),

  intervalDays: integer('interval_days'),
  daysOfWeek: integer('days_of_week').array(),  // [0-6] for weekly schedules
  scenesPerPublish: integer('scenes_per_publish').default(1),

  isActive: boolean('is_active').default(true),
  isCompleted: boolean('is_completed').default(false),
  lastPublishedAt: timestamp('last_published_at'),
  nextPublishAt: timestamp('next_publish_at'),
  totalPublished: integer('total_published').default(0),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### 2. Scheduled Publications Table

Already exists in `drizzle/schema.ts`. No changes needed.

```typescript
export const scheduledPublications = pgTable('scheduled_publications', {
  id: text().primaryKey(),
  scheduleId: text('schedule_id').references(() => publishingSchedules.id, { onDelete: 'cascade' }),
  storyId: text('story_id').references(() => stories.id, { onDelete: 'cascade' }).notNull(),
  chapterId: text('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }),
  sceneId: text('scene_id').references(() => scenes.id, { onDelete: 'cascade' }),

  scheduledFor: timestamp('scheduled_for').notNull(),
  publishedAt: timestamp('published_at'),

  status: publicationStatus().default('pending').notNull(),  // 'pending' | 'published' | 'failed' | 'cancelled'
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### 3. Database Migration for Scenes Table

**File**: `drizzle/migrations/XXXX_add_scene_publishing_fields.sql`

```sql
-- Add publishing fields to scenes table
ALTER TABLE scenes
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP,
  ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'private' NOT NULL,
  ADD COLUMN IF NOT EXISTS published_by TEXT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS unpublished_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS unpublished_by TEXT REFERENCES users(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenes_published_at ON scenes(published_at);
CREATE INDEX IF NOT EXISTS idx_scenes_scheduled_for ON scenes(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scenes_visibility ON scenes(visibility);
CREATE INDEX IF NOT EXISTS idx_scenes_status_visibility ON scenes(status, visibility);
```

**Run migration:**
```bash
dotenv --file .env.local run pnpm db:generate
dotenv --file .env.local run pnpm db:migrate
```

---

## Vercel Cron Job Setup

### Configuration File

**File**: `vercel.json` (root directory)

```json
{
  "crons": [
    {
      "path": "/publish/api/cron",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Cron Schedule Breakdown:**
- `0 8 * * *` = Daily at 8:00 AM UTC
- This runs ONCE per day, checking all pending publications
- Actual publication times are stored in `scheduledPublications.scheduledFor`

### Cron Job Endpoint

**File**: `src/app/publish/api/cron/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scheduledPublications, publishingSchedules } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';

/**
 * Vercel Cron Job Endpoint
 * Runs daily at 8:00 AM UTC
 * Publishes all scenes scheduled for today or earlier
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (security check)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    console.log(`[Cron Job] Starting publication check at ${now.toISOString()}`);

    // Get all pending publications due now or earlier
    const pendingPublications = await db
      .select()
      .from(scheduledPublications)
      .where(
        and(
          eq(scheduledPublications.status, 'pending'),
          lte(scheduledPublications.scheduledFor, now)
        )
      )
      .limit(100); // Process max 100 per run

    console.log(`[Cron Job] Found ${pendingPublications.length} pending publications`);

    const results = {
      total: pendingPublications.length,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each publication
    for (const publication of pendingPublications) {
      try {
        if (publication.sceneId) {
          // Publish scene
          await publishScene(publication.sceneId, 'system');

          // Mark as published
          await db
            .update(scheduledPublications)
            .set({
              status: 'published',
              publishedAt: now,
              updatedAt: now,
            })
            .where(eq(scheduledPublications.id, publication.id));

          // Update schedule stats
          if (publication.scheduleId) {
            await db
              .update(publishingSchedules)
              .set({
                lastPublishedAt: now,
                totalPublished: sql`${publishingSchedules.totalPublished} + 1`,
                updatedAt: now,
              })
              .where(eq(publishingSchedules.id, publication.scheduleId));
          }

          results.succeeded++;
          console.log(`[Cron Job] ✅ Published scene ${publication.sceneId}`);
        }
      } catch (error) {
        // Mark as failed
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await db
          .update(scheduledPublications)
          .set({
            status: 'failed',
            errorMessage,
            retryCount: sql`${scheduledPublications.retryCount} + 1`,
            updatedAt: now,
          })
          .where(eq(scheduledPublications.id, publication.id));

        results.failed++;
        results.errors.push(`Scene ${publication.sceneId}: ${errorMessage}`);
        console.error(`[Cron Job] ❌ Failed to publish scene ${publication.sceneId}:`, error);
      }
    }

    console.log(`[Cron Job] Completed: ${results.succeeded} succeeded, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('[Cron Job] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Publish a single scene
 */
async function publishScene(sceneId: string, publishedBy: string): Promise<void> {
  const now = new Date();

  await db
    .update(scenes)
    .set({
      publishedAt: now,
      visibility: 'public',
      publishedBy,
      status: 'published',
      updatedAt: now,
    })
    .where(eq(scenes.id, sceneId));
}
```

### Environment Variable

Add to `.env.local`:

```bash
# Cron job secret for security
CRON_SECRET=your-random-secret-here-change-in-production
```

**Generate secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## API Endpoints

### 1. Create Publishing Schedule

**Endpoint**: `POST /publish/api/schedules`

**File**: `src/app/publish/api/schedules/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { publishingSchedules, scheduledPublications, scenes, chapters } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const createScheduleSchema = z.object({
  storyId: z.string(),
  chapterId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  dayOfWeek: z.number().min(0).max(6),  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  publishTime: z.string().regex(/^\d{2}:\d{2}$/),  // HH:MM format
  scenesPerWeek: z.number().min(1).max(10).default(1),
  startDate: z.string(),  // ISO date string
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createScheduleSchema.parse(body);

    // Get unpublished scenes for this story/chapter
    const unpublishedScenes = await getUnpublishedScenes(data.storyId, data.chapterId);

    if (unpublishedScenes.length === 0) {
      return NextResponse.json(
        { error: 'No unpublished scenes found' },
        { status: 400 }
      );
    }

    // Calculate next publish date
    const startDate = new Date(data.startDate);
    const nextPublishAt = calculateNextPublishTime(startDate, data.publishTime, data.dayOfWeek);

    // Create schedule
    const scheduleId = nanoid();
    await db.insert(publishingSchedules).values({
      id: scheduleId,
      storyId: data.storyId,
      chapterId: data.chapterId || null,
      createdBy: session.user.id,
      name: data.name,
      description: data.description || null,
      scheduleType: 'weekly',
      startDate: data.startDate,
      publishTime: data.publishTime + ':00',  // Add seconds
      daysOfWeek: [data.dayOfWeek],
      scenesPerPublish: data.scenesPerWeek,
      isActive: true,
      isCompleted: false,
      nextPublishAt,
      totalPublished: 0,
    });

    // Generate publication queue
    const publications = await generatePublicationQueue(
      scheduleId,
      data.storyId,
      unpublishedScenes,
      startDate,
      data.publishTime,
      data.dayOfWeek,
      data.scenesPerWeek
    );

    return NextResponse.json({
      scheduleId,
      totalScenes: unpublishedScenes.length,
      totalPublications: publications.length,
      nextPublishAt: nextPublishAt.toISOString(),
      preview: publications.slice(0, 5), // First 5 publications
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create schedule:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

/**
 * Get unpublished scenes for a story/chapter
 */
async function getUnpublishedScenes(storyId: string, chapterId?: string) {
  let query = db
    .select()
    .from(scenes)
    .leftJoin(chapters, eq(scenes.chapterId, chapters.id))
    .where(
      and(
        eq(chapters.storyId, storyId),
        isNull(scenes.publishedAt)
      )
    )
    .orderBy(scenes.orderIndex);

  if (chapterId) {
    query = query.where(eq(scenes.chapterId, chapterId));
  }

  const results = await query;
  return results.map(r => r.scenes);
}

/**
 * Calculate next publish time based on day of week
 */
function calculateNextPublishTime(
  startDate: Date,
  publishTime: string,  // HH:MM
  dayOfWeek: number     // 0-6
): Date {
  const [hours, minutes] = publishTime.split(':').map(Number);
  const date = new Date(startDate);
  date.setHours(hours, minutes, 0, 0);

  // If start date is before desired day of week, advance to that day
  const currentDay = date.getDay();
  if (currentDay !== dayOfWeek) {
    const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
    date.setDate(date.getDate() + daysToAdd);
  }

  return date;
}

/**
 * Generate publication queue
 */
async function generatePublicationQueue(
  scheduleId: string,
  storyId: string,
  scenes: any[],
  startDate: Date,
  publishTime: string,
  dayOfWeek: number,
  scenesPerWeek: number
): Promise<any[]> {
  const publications: any[] = [];
  let currentDate = calculateNextPublishTime(startDate, publishTime, dayOfWeek);
  let sceneIndex = 0;

  while (sceneIndex < scenes.length) {
    const scenesToPublish = scenes.slice(sceneIndex, sceneIndex + scenesPerWeek);

    for (const scene of scenesToPublish) {
      publications.push({
        id: nanoid(),
        scheduleId,
        storyId,
        chapterId: scene.chapterId,
        sceneId: scene.id,
        scheduledFor: currentDate.toISOString(),
        status: 'pending',
        retryCount: 0,
      });
    }

    sceneIndex += scenesPerWeek;

    // Next week (same day of week)
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 7);
  }

  // Insert all publications
  if (publications.length > 0) {
    await db.insert(scheduledPublications).values(publications);
  }

  return publications;
}
```

### 2. Get Timeline Events

**Endpoint**: `GET /publish/api/timeline`

**File**: `src/app/publish/api/timeline/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scheduledPublications, scenes, chapters, stories } from '@/lib/db/schema';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get user's stories
    const userStories = await db
      .select({ id: stories.id })
      .from(stories)
      .where(eq(stories.authorId, session.user.id));

    const storyIds = userStories.map(s => s.id);

    if (storyIds.length === 0) {
      return NextResponse.json({ events: [] });
    }

    // Build query
    let query = db
      .select({
        publication: scheduledPublications,
        scene: scenes,
        chapter: chapters,
      })
      .from(scheduledPublications)
      .leftJoin(scenes, eq(scheduledPublications.sceneId, scenes.id))
      .leftJoin(chapters, eq(scheduledPublications.chapterId, chapters.id))
      .where(inArray(scheduledPublications.storyId, storyIds));

    if (storyId) {
      query = query.where(eq(scheduledPublications.storyId, storyId));
    }

    if (startDate) {
      query = query.where(gte(scheduledPublications.scheduledFor, new Date(startDate)));
    }

    if (endDate) {
      query = query.where(lte(scheduledPublications.scheduledFor, new Date(endDate)));
    }

    const results = await query;

    const events = results.map(r => ({
      id: r.publication.id,
      sceneId: r.publication.sceneId,
      chapterId: r.publication.chapterId,
      title: r.scene?.title || r.chapter?.title || 'Untitled',
      date: r.publication.scheduledFor,
      status: r.publication.status,
      type: r.scene ? 'scene' : 'chapter',
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Failed to fetch timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}
```

### 3. Manual Scene Publishing

**Endpoint**: `POST /publish/api/scenes/[sceneId]`

**File**: `src/app/publish/api/scenes/[sceneId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scenes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { sceneId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sceneId } = params;
    const body = await request.json();
    const { visibility = 'public' } = body;

    const now = new Date();

    // Update scene
    await db
      .update(scenes)
      .set({
        publishedAt: now,
        publishedBy: session.user.id,
        visibility,
        status: 'published',
        updatedAt: now,
      })
      .where(eq(scenes.id, sceneId));

    return NextResponse.json({
      success: true,
      publishedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Failed to publish scene:', error);
    return NextResponse.json(
      { error: 'Failed to publish scene' },
      { status: 500 }
    );
  }
}
```

**Endpoint**: `POST /publish/api/scenes/[sceneId]/unpublish`

**File**: `src/app/publish/api/scenes/[sceneId]/unpublish/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scenes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { sceneId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sceneId } = params;
    const now = new Date();

    // Update scene
    await db
      .update(scenes)
      .set({
        publishedAt: null,
        visibility: 'private',
        unpublishedAt: now,
        unpublishedBy: session.user.id,
        status: 'writing',
        updatedAt: now,
      })
      .where(eq(scenes.id, sceneId));

    return NextResponse.json({
      success: true,
      unpublishedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Failed to unpublish scene:', error);
    return NextResponse.json(
      { error: 'Failed to unpublish scene' },
      { status: 500 }
    );
  }
}
```

---

## Services & Utilities

### Publishing Service

**File**: `src/lib/services/publishing.ts`

```typescript
import { db } from '@/lib/db';
import { publishingSchedules, scheduledPublications, scenes } from '@/lib/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';

export interface CreateScheduleParams {
  storyId: string;
  chapterId?: string;
  createdBy: string;
  name: string;
  description?: string;
  dayOfWeek: number;
  publishTime: string;
  scenesPerWeek: number;
  startDate: string;
}

export async function createPublishingSchedule(params: CreateScheduleParams): Promise<string> {
  // Implementation from API endpoint
  // Extract into reusable service for testing
}

export async function pauseSchedule(scheduleId: string): Promise<void> {
  await db
    .update(publishingSchedules)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(publishingSchedules.id, scheduleId));
}

export async function resumeSchedule(scheduleId: string): Promise<void> {
  await db
    .update(publishingSchedules)
    .set({
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(publishingSchedules.id, scheduleId));
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  // Cascade delete handles scheduledPublications
  await db
    .delete(publishingSchedules)
    .where(eq(publishingSchedules.id, scheduleId));
}

export async function getScheduleProgress(scheduleId: string) {
  const publications = await db
    .select()
    .from(scheduledPublications)
    .where(eq(scheduledPublications.scheduleId, scheduleId));

  const total = publications.length;
  const published = publications.filter(p => p.status === 'published').length;
  const pending = publications.filter(p => p.status === 'pending').length;
  const failed = publications.filter(p => p.status === 'failed').length;
  const percentage = total > 0 ? (published / total) * 100 : 0;

  return { total, published, pending, failed, percentage };
}
```

---

## UI Components

### Schedule Builder Component

**File**: `src/components/publish/ScheduleBuilder.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ScheduleBuilderProps {
  storyId: string;
  chapterId?: string;
  totalScenes: number;
  onComplete?: () => void;
}

export function ScheduleBuilder({
  storyId,
  chapterId,
  totalScenes,
  onComplete,
}: ScheduleBuilderProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dayOfWeek: 1,  // Monday
    publishTime: '09:00',
    scenesPerWeek: 1,
    startDate: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/publish/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          chapterId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create schedule');
      }

      const { scheduleId } = await response.json();

      toast.success('Publishing schedule created!');
      onComplete?.();
      router.refresh();
    } catch (error) {
      console.error('Failed to create schedule:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const weekDays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form fields implementation */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Schedule Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border"
          placeholder="e.g., Weekly Monday Release"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Day of Week
        </label>
        <select
          value={formData.dayOfWeek}
          onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
          className="w-full px-4 py-2 rounded-lg border"
        >
          {weekDays.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Publish Time
        </label>
        <input
          type="time"
          value={formData.publishTime}
          onChange={(e) => setFormData({ ...formData, publishTime: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Scenes Per Week
        </label>
        <input
          type="number"
          min="1"
          max={totalScenes}
          value={formData.scenesPerWeek}
          onChange={(e) => setFormData({ ...formData, scenesPerWeek: parseInt(e.target.value) })}
          className="w-full px-4 py-2 rounded-lg border"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Start Date
        </label>
        <input
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Creating...' : 'Create Schedule'}
      </button>
    </form>
  );
}
```

### Timeline Calendar Component

See existing `src/components/publish/PublishTimeline.tsx` - enhance with:
- Drag-and-drop rescheduling
- Status-based color coding
- Mobile-responsive list view
- Quick action context menu

---

## Implementation Phases

### Phase 1: Database & Core APIs (Week 1)

**Tasks:**
1. ✅ Run database migration for scene publishing fields
2. ✅ Create `/api/publish/schedules` endpoint (create schedule)
3. ✅ Create `/api/publish/timeline` endpoint (get events)
4. ✅ Create `/api/publish/scenes/[id]` endpoint (manual publish)
5. ✅ Create `/api/publish/scenes/[id]/unpublish` endpoint
6. ✅ Create publishing service utilities

**Deliverables:**
- Database schema updated
- API endpoints functional
- Publishing service tested

**Testing:**
```bash
# Test database migration
dotenv --file .env.local run pnpm db:migrate

# Test schedule creation
curl -X POST http://localhost:3000/publish/api/schedules \
  -H "Content-Type: application/json" \
  -d '{"storyId":"...", "name":"Test", "dayOfWeek":1, "publishTime":"09:00", "startDate":"2025-11-11"}'

# Test timeline
curl http://localhost:3000/publish/api/timeline
```

### Phase 2: Vercel Cron Job (Week 2)

**Tasks:**
1. ✅ Create `vercel.json` with cron configuration
2. ✅ Create `/api/publish/cron` endpoint
3. ✅ Implement publication processing logic
4. ✅ Add error handling and retry logic
5. ✅ Test locally with manual triggers
6. ✅ Deploy to Vercel and test production cron

**Deliverables:**
- Vercel cron job configured
- Automated publishing working
- Error logging functional

**Testing:**
```bash
# Test cron endpoint locally
curl -X GET http://localhost:3000/publish/api/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Monitor Vercel deployment logs
vercel logs --follow
```

### Phase 3: UI Components (Week 3)

**Tasks:**
1. ✅ Build `ScheduleBuilder` component
2. ✅ Enhance `PublishTimeline` with calendar view
3. ✅ Add manual publish/unpublish controls
4. ✅ Create schedule management UI
5. ✅ Implement mobile-responsive views

**Deliverables:**
- Complete publishing UI
- Timeline visualization working
- Mobile-optimized experience

**Testing:**
```bash
# Run dev server
dotenv --file .env.local run pnpm dev

# Navigate to /publish
# Test schedule creation flow
# Test timeline calendar interactions
# Test manual publish/unpublish
```

### Phase 4: Polish & Optimization (Week 4)

**Tasks:**
1. ✅ Add loading states and skeleton UI
2. ✅ Implement error boundaries
3. ✅ Add success/error notifications
4. ✅ Optimize database queries
5. ✅ Add caching for timeline data
6. ✅ Write comprehensive tests

**Deliverables:**
- Polished user experience
- Optimized performance
- Test coverage > 80%

**Testing:**
```bash
# Run unit tests
dotenv --file .env.local run pnpm test

# Run E2E tests
dotenv --file .env.local run npx playwright test tests/publish.spec.ts
```

---

## Testing Strategy

### Unit Tests

**File**: `__tests__/publishing.test.ts`

```typescript
import { createPublishingSchedule, getScheduleProgress } from '@/lib/services/publishing';
import { db } from '@/lib/db';

describe('Publishing Service', () => {
  it('creates publishing schedule', async () => {
    const scheduleId = await createPublishingSchedule({
      storyId: 'test-story',
      createdBy: 'test-user',
      name: 'Test Schedule',
      dayOfWeek: 1,
      publishTime: '09:00',
      scenesPerWeek: 1,
      startDate: '2025-11-11',
    });

    expect(scheduleId).toBeTruthy();
  });

  it('calculates schedule progress', async () => {
    const progress = await getScheduleProgress('test-schedule-id');

    expect(progress).toHaveProperty('total');
    expect(progress).toHaveProperty('published');
    expect(progress).toHaveProperty('pending');
    expect(progress).toHaveProperty('failed');
    expect(progress).toHaveProperty('percentage');
  });
});
```

### E2E Tests

**File**: `tests/publish.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Publishing System', () => {
  test('creates publishing schedule', async ({ page }) => {
    await page.goto('/publish');

    // Click create schedule button
    await page.click('text=Create Schedule');

    // Fill form
    await page.fill('input[name="name"]', 'Test Weekly Release');
    await page.selectOption('select[name="dayOfWeek"]', '1');
    await page.fill('input[name="publishTime"]', '09:00');
    await page.fill('input[name="startDate"]', '2025-11-11');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('text=Schedule created')).toBeVisible();
  });

  test('displays timeline calendar', async ({ page }) => {
    await page.goto('/publish');

    // Verify calendar is visible
    await expect(page.locator('.calendar-grid')).toBeVisible();

    // Verify events are rendered
    const events = page.locator('.calendar-event');
    await expect(events).toHaveCount({ timeout: 5000, count: expect.any(Number) });
  });

  test('manually publishes scene', async ({ page }) => {
    await page.goto('/publish');

    // Click scene
    await page.click('.scene-card:first-child');

    // Click publish button
    await page.click('button:has-text("Publish Now")');

    // Verify success
    await expect(page.locator('text=Scene published')).toBeVisible();
  });
});
```

---

## Related Documents

- **📖 Specification**: `publish-specification.md` - What, why, and how
- **📋 Novels Spec**: `../novels/novels-specification.md` - Scene-based structure
- **🎨 Comics Spec**: `../comics/comics-architecture.md` - Panel-based structure

---

**Status**: 🏗️ In Progress
**Last Updated**: 2025-11-04
**Next Steps**: Begin Phase 1 implementation

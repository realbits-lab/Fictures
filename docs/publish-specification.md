# Publishing & Scheduling Specification

This document outlines the specifications for a comprehensive publishing system with scene-by-scene scheduling, automated publishing, duration-based scheduling (daily/weekly), manual status control, and beautiful timeline visualization.

## Table of Contents
1. [Current State Analysis](#current-state-analysis)
2. [Database Schema Updates](#database-schema-updates)
3. [Publishing Schedules](#publishing-schedules)
4. [Scene-by-Scene Publishing](#scene-by-scene-publishing)
5. [Manual Status Control](#manual-status-control)
6. [Timeline Visualization](#timeline-visualization)
7. [API Endpoints](#api-endpoints)
8. [Component Implementation](#component-implementation)
9. [Responsive Mobile Design](#responsive-mobile-design)
10. [Automation & Background Jobs](#automation--background-jobs)
11. [Implementation Plan](#implementation-plan)

---

## Current State Analysis

### What Currently Exists

#### Database Schema
**Stories Table:**
- `status` field: 'writing' | 'published'
- Basic publication tracking

**Chapters Table:**
- `status` field: 'writing' | 'published'
- `publishedAt` timestamp
- Chapter-level publishing supported

**Scenes Table:**
- `status` field but NO publishing workflow
- No `publishedAt` or `scheduledFor` fields
- No scene-level publishing support

**Publishing History Table:**
- Tracks chapter publications
- Records who published and when
- Stores validation results

#### API Endpoints
- ✅ POST `/api/publish/chapters/[chapterId]` - Publish individual chapter
- ✅ GET `/api/publish/analytics` - Mock analytics data
- ❌ No scene publishing endpoint
- ❌ No scheduling endpoint
- ❌ No bulk publishing endpoint

#### UI Components
- ✅ `PublishClient` - Basic publish interface
- ✅ `PublishingSchedule` - Mock schedule display
- ❌ No timeline calendar
- ❌ No scene selector
- ❌ No schedule builder

### What Needs Implementation

#### Critical Missing Features
1. **Scene-by-Scene Publishing**
   - Database schema for scene publishing
   - Scene publishing API
   - Scene status management
   - Scene preview before publishing

2. **Automated Scheduling**
   - Schedule creation and storage
   - Background job processor
   - Automated publication at scheduled times
   - Notification system

3. **Publishing Durations**
   - Daily publishing schedules
   - Weekly publishing schedules
   - Custom interval schedules
   - Schedule templates

4. **Timeline Visualization**
   - Calendar view with published/scheduled scenes
   - Gantt-style timeline
   - Drag-and-drop rescheduling
   - Visual publish roadmap

5. **Manual Status Control**
   - Quick publish/unpublish actions
   - Bulk status updates
   - Status history tracking
   - Rollback capability

---

## Database Schema Updates

### 1. Update `scenes` Table

**Add publishing fields:**

```sql
ALTER TABLE scenes
ADD COLUMN published_at TIMESTAMP,
ADD COLUMN scheduled_for TIMESTAMP,
ADD COLUMN visibility VARCHAR(20) DEFAULT 'private' NOT NULL,
ADD COLUMN auto_publish BOOLEAN DEFAULT FALSE,
ADD COLUMN published_by TEXT REFERENCES users(id),
ADD COLUMN unpublished_at TIMESTAMP,
ADD COLUMN unpublished_by TEXT REFERENCES users(id);

CREATE INDEX idx_scenes_published_at ON scenes(published_at);
CREATE INDEX idx_scenes_scheduled_for ON scenes(scheduled_for);
CREATE INDEX idx_scenes_visibility ON scenes(visibility);
CREATE INDEX idx_scenes_status_visibility ON scenes(status, visibility);
```

**Visibility Options:**
- `private` - Only visible to author
- `unlisted` - Accessible via direct link only
- `public` - Fully published and visible

### 2. New Table: `publishing_schedules`

**Purpose:** Store automated publishing schedules for stories/chapters

```sql
CREATE TABLE publishing_schedules (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  schedule_type VARCHAR(20) NOT NULL, -- daily, weekly, custom, one-time
  start_date DATE NOT NULL,
  end_date DATE,
  publish_time TIME NOT NULL DEFAULT '09:00:00', -- Time of day to publish
  interval_days INTEGER, -- For custom intervals (e.g., every 3 days)
  days_of_week INTEGER[], -- For weekly: [0,1,2,3,4,5,6] Sunday=0
  scenes_per_publish INTEGER DEFAULT 1, -- How many scenes to publish per schedule
  is_active BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE,
  last_published_at TIMESTAMP,
  next_publish_at TIMESTAMP,
  total_published INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_publishing_schedules_story ON publishing_schedules(story_id);
CREATE INDEX idx_publishing_schedules_next_publish ON publishing_schedules(next_publish_at);
CREATE INDEX idx_publishing_schedules_active ON publishing_schedules(is_active);
```

**Schedule Types:**
- `daily` - Publish every day at specified time
- `weekly` - Publish on specific days of week
- `custom` - Publish every N days
- `one-time` - Single scheduled publication

### 3. New Table: `scheduled_publications`

**Purpose:** Queue of individual scenes/chapters to be published

```sql
CREATE TABLE scheduled_publications (
  id TEXT PRIMARY KEY,
  schedule_id TEXT REFERENCES publishing_schedules(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE CASCADE,
  scene_id TEXT REFERENCES scenes(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP NOT NULL,
  published_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- pending, published, failed, cancelled
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CHECK (
    (chapter_id IS NOT NULL AND scene_id IS NULL) OR
    (chapter_id IS NULL AND scene_id IS NOT NULL)
  )
);

CREATE INDEX idx_scheduled_publications_schedule ON scheduled_publications(schedule_id);
CREATE INDEX idx_scheduled_publications_scheduled_for ON scheduled_publications(scheduled_for);
CREATE INDEX idx_scheduled_publications_status ON scheduled_publications(status);
CREATE INDEX idx_scheduled_publications_pending ON scheduled_publications(status, scheduled_for) WHERE status = 'pending';
```

**Publication Statuses:**
- `pending` - Waiting to be published
- `published` - Successfully published
- `failed` - Publication failed
- `cancelled` - Cancelled by user

### 4. Update `publishing_history` Table

**Add scene support:**

```sql
ALTER TABLE publishing_history
ADD COLUMN scene_id TEXT REFERENCES scenes(id) ON DELETE CASCADE,
ADD COLUMN schedule_id TEXT REFERENCES publishing_schedules(id) ON DELETE SET NULL,
ADD COLUMN was_scheduled BOOLEAN DEFAULT FALSE,
ADD COLUMN visibility VARCHAR(20);

CREATE INDEX idx_publishing_history_scene ON publishing_history(scene_id);
CREATE INDEX idx_publishing_history_schedule ON publishing_history(schedule_id);
```

### 5. Update Drizzle Schema

**Location:** `src/lib/db/schema.ts`

```typescript
import { pgTable, text, timestamp, integer, boolean, json, varchar, date, time } from 'drizzle-orm/pg-core';

// Visibility enum
export const visibilityEnum = pgEnum('visibility', ['private', 'unlisted', 'public']);

// Schedule type enum
export const scheduleTypeEnum = pgEnum('schedule_type', ['daily', 'weekly', 'custom', 'one-time']);

// Publication status enum
export const publicationStatusEnum = pgEnum('publication_status', ['pending', 'published', 'failed', 'cancelled']);

// Updated scenes table
export const scenes = pgTable('scenes', {
  id: text('id').primaryKey(),
  chapterId: text('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').default(''),
  orderIndex: integer('order_index').notNull(),
  wordCount: integer('word_count').default(0),
  status: statusEnum('status').default('writing').notNull(),

  // Publishing fields
  publishedAt: timestamp('published_at'),
  scheduledFor: timestamp('scheduled_for'),
  visibility: visibilityEnum('visibility').default('private').notNull(),
  autoPublish: boolean('auto_publish').default(false),
  publishedBy: text('published_by').references(() => users.id),
  unpublishedAt: timestamp('unpublished_at'),
  unpublishedBy: text('unpublished_by').references(() => users.id),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Publishing schedules table
export const publishingSchedules = pgTable('publishing_schedules', {
  id: text('id').primaryKey(),
  storyId: text('story_id').references(() => stories.id, { onDelete: 'cascade' }).notNull(),
  chapterId: text('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  scheduleType: scheduleTypeEnum('schedule_type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  publishTime: time('publish_time').default('09:00:00').notNull(),
  intervalDays: integer('interval_days'),
  daysOfWeek: integer('days_of_week').array(),
  scenesPerPublish: integer('scenes_per_publish').default(1),
  isActive: boolean('is_active').default(true),
  isCompleted: boolean('is_completed').default(false),
  lastPublishedAt: timestamp('last_published_at'),
  nextPublishAt: timestamp('next_publish_at'),
  totalPublished: integer('total_published').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Scheduled publications table
export const scheduledPublications = pgTable('scheduled_publications', {
  id: text('id').primaryKey(),
  scheduleId: text('schedule_id').references(() => publishingSchedules.id, { onDelete: 'cascade' }),
  storyId: text('story_id').references(() => stories.id, { onDelete: 'cascade' }).notNull(),
  chapterId: text('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }),
  sceneId: text('scene_id').references(() => scenes.id, { onDelete: 'cascade' }),
  scheduledFor: timestamp('scheduled_for').notNull(),
  publishedAt: timestamp('published_at'),
  status: publicationStatusEnum('status').default('pending').notNull(),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const publishingSchedulesRelations = relations(publishingSchedules, ({ one, many }) => ({
  story: one(stories, {
    fields: [publishingSchedules.storyId],
    references: [stories.id],
  }),
  chapter: one(chapters, {
    fields: [publishingSchedules.chapterId],
    references: [chapters.id],
  }),
  creator: one(users, {
    fields: [publishingSchedules.createdBy],
    references: [users.id],
  }),
  publications: many(scheduledPublications),
}));

export const scheduledPublicationsRelations = relations(scheduledPublications, ({ one }) => ({
  schedule: one(publishingSchedules, {
    fields: [scheduledPublications.scheduleId],
    references: [publishingSchedules.id],
  }),
  story: one(stories, {
    fields: [scheduledPublications.storyId],
    references: [stories.id],
  }),
  chapter: one(chapters, {
    fields: [scheduledPublications.chapterId],
    references: [chapters.id],
  }),
  scene: one(scenes, {
    fields: [scheduledPublications.sceneId],
    references: [scenes.id],
  }),
}));
```

---

## Publishing Schedules

### Schedule Builder Service

**Location:** `src/lib/services/publishing.ts`

```typescript
import { db } from '@/lib/db';
import { publishingSchedules, scheduledPublications, scenes, chapters } from '@/lib/db/schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface CreateScheduleParams {
  storyId: string;
  chapterId?: string;
  createdBy: string;
  name: string;
  description?: string;
  scheduleType: 'daily' | 'weekly' | 'custom' | 'one-time';
  startDate: Date;
  endDate?: Date;
  publishTime: string; // HH:MM:SS format
  intervalDays?: number;
  daysOfWeek?: number[]; // [0,1,2,3,4,5,6] for weekly
  scenesPerPublish?: number;
}

export async function createPublishingSchedule(params: CreateScheduleParams): Promise<string> {
  const {
    storyId,
    chapterId,
    createdBy,
    name,
    description,
    scheduleType,
    startDate,
    endDate,
    publishTime,
    intervalDays,
    daysOfWeek,
    scenesPerPublish = 1,
  } = params;

  // Validation
  if (scheduleType === 'weekly' && (!daysOfWeek || daysOfWeek.length === 0)) {
    throw new Error('Weekly schedule requires at least one day of week');
  }

  if (scheduleType === 'custom' && !intervalDays) {
    throw new Error('Custom schedule requires interval days');
  }

  // Get scenes to publish
  const scenesToPublish = await getUnpublishedScenes(storyId, chapterId);

  if (scenesToPublish.length === 0) {
    throw new Error('No unpublished scenes found');
  }

  // Calculate next publish time
  const nextPublishAt = calculateNextPublishTime(startDate, publishTime);

  // Create schedule
  const scheduleId = nanoid();
  await db.insert(publishingSchedules).values({
    id: scheduleId,
    storyId,
    chapterId,
    createdBy,
    name,
    description,
    scheduleType,
    startDate,
    endDate,
    publishTime,
    intervalDays,
    daysOfWeek,
    scenesPerPublish,
    isActive: true,
    isCompleted: false,
    nextPublishAt,
    totalPublished: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Generate scheduled publications
  await generateScheduledPublications(scheduleId, params, scenesToPublish);

  return scheduleId;
}

async function getUnpublishedScenes(storyId: string, chapterId?: string): Promise<any[]> {
  let query = db
    .select()
    .from(scenes)
    .leftJoin(chapters, eq(scenes.chapterId, chapters.id))
    .where(
      and(
        eq(chapters.storyId, storyId),
        isNull(scenes.publishedAt)
      )
    );

  if (chapterId) {
    query = query.where(eq(scenes.chapterId, chapterId));
  }

  const results = await query.orderBy(scenes.orderIndex);
  return results.map(r => r.scenes);
}

async function generateScheduledPublications(
  scheduleId: string,
  params: CreateScheduleParams,
  scenes: any[]
): Promise<void> {
  const {
    storyId,
    chapterId,
    scheduleType,
    startDate,
    endDate,
    publishTime,
    intervalDays,
    daysOfWeek,
    scenesPerPublish = 1,
  } = params;

  const publications: any[] = [];
  let currentDate = new Date(startDate);
  let sceneIndex = 0;

  while (sceneIndex < scenes.length) {
    // Calculate publish datetime
    const publishDateTime = new Date(currentDate);
    const [hours, minutes] = publishTime.split(':');
    publishDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Check if within date range
    if (endDate && publishDateTime > endDate) {
      break;
    }

    // Create publication for scene(s)
    const scenesToPublishNow = scenes.slice(sceneIndex, sceneIndex + scenesPerPublish);

    for (const scene of scenesToPublishNow) {
      publications.push({
        id: nanoid(),
        scheduleId,
        storyId,
        chapterId: scene.chapterId,
        sceneId: scene.id,
        scheduledFor: publishDateTime,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    sceneIndex += scenesPerPublish;

    // Calculate next publish date
    currentDate = calculateNextDate(currentDate, scheduleType, intervalDays, daysOfWeek);
  }

  // Insert all publications
  if (publications.length > 0) {
    await db.insert(scheduledPublications).values(publications);
  }
}

function calculateNextDate(
  currentDate: Date,
  scheduleType: string,
  intervalDays?: number,
  daysOfWeek?: number[]
): Date {
  const nextDate = new Date(currentDate);

  switch (scheduleType) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;

    case 'weekly':
      if (!daysOfWeek || daysOfWeek.length === 0) break;

      // Find next day of week
      const currentDay = nextDate.getDay();
      let daysToAdd = 1;

      // Sort days and find next occurrence
      const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
      const nextDay = sortedDays.find(day => day > currentDay);

      if (nextDay !== undefined) {
        daysToAdd = nextDay - currentDay;
      } else {
        // Wrap to next week
        daysToAdd = 7 - currentDay + sortedDays[0];
      }

      nextDate.setDate(nextDate.getDate() + daysToAdd);
      break;

    case 'custom':
      if (intervalDays) {
        nextDate.setDate(nextDate.getDate() + intervalDays);
      }
      break;

    case 'one-time':
      // No next date for one-time schedules
      break;
  }

  return nextDate;
}

function calculateNextPublishTime(date: Date, time: string): Date {
  const publishDate = new Date(date);
  const [hours, minutes] = time.split(':');
  publishDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return publishDate;
}

export async function updateScheduleStatus(
  scheduleId: string,
  isActive: boolean
): Promise<void> {
  await db
    .update(publishingSchedules)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(publishingSchedules.id, scheduleId));
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  // This will cascade delete all scheduled_publications
  await db
    .delete(publishingSchedules)
    .where(eq(publishingSchedules.id, scheduleId));
}

export async function getScheduleProgress(scheduleId: string): Promise<{
  total: number;
  published: number;
  pending: number;
  failed: number;
  percentage: number;
}> {
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

## Scene-by-Scene Publishing

### Publishing Service

**Location:** `src/lib/services/scene-publishing.ts`

```typescript
import { db } from '@/lib/db';
import { scenes, publishingHistory, chapters, stories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface PublishSceneParams {
  sceneId: string;
  publishedBy: string;
  visibility?: 'private' | 'unlisted' | 'public';
  scheduledFor?: Date;
  validateContent?: boolean;
}

export async function publishScene(params: PublishSceneParams): Promise<void> {
  const {
    sceneId,
    publishedBy,
    visibility = 'public',
    scheduledFor,
    validateContent = true,
  } = params;

  // Get scene with chapter and story
  const [sceneData] = await db
    .select()
    .from(scenes)
    .leftJoin(chapters, eq(scenes.chapterId, chapters.id))
    .leftJoin(stories, eq(chapters.storyId, stories.id))
    .where(eq(scenes.id, sceneId))
    .limit(1);

  if (!sceneData) {
    throw new Error('Scene not found');
  }

  const scene = sceneData.scenes;
  const chapter = sceneData.chapters;
  const story = sceneData.stories;

  // Validate content if required
  if (validateContent) {
    const validation = await validateSceneForPublishing(scene);
    if (!validation.isValid) {
      throw new Error(`Scene validation failed: ${validation.errors.join(', ')}`);
    }
  }

  const now = new Date();

  // Update scene
  await db
    .update(scenes)
    .set({
      publishedAt: scheduledFor || now,
      publishedBy,
      visibility,
      scheduledFor: scheduledFor || null,
      status: 'published',
      updatedAt: now,
    })
    .where(eq(scenes.id, sceneId));

  // Update chapter status if all scenes published
  const chapterScenes = await db
    .select()
    .from(scenes)
    .where(eq(scenes.chapterId, scene.chapterId));

  const allPublished = chapterScenes.every(s => s.publishedAt !== null);

  if (allPublished && chapter) {
    await db
      .update(chapters)
      .set({
        status: 'published',
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(chapters.id, scene.chapterId));
  }

  // Record in publishing history
  await db.insert(publishingHistory).values({
    id: nanoid(),
    storyId: chapter?.storyId || '',
    chapterId: scene.chapterId,
    sceneId: scene.id,
    publishedBy,
    visibility,
    wasScheduled: !!scheduledFor,
    validationResults: JSON.stringify({ isValid: true }),
    publishedAt: now,
  });
}

export async function unpublishScene(sceneId: string, unpublishedBy: string): Promise<void> {
  const now = new Date();

  await db
    .update(scenes)
    .set({
      publishedAt: null,
      visibility: 'private',
      unpublishedAt: now,
      unpublishedBy,
      status: 'writing',
      updatedAt: now,
    })
    .where(eq(scenes.id, sceneId));
}

export async function bulkPublishScenes(
  sceneIds: string[],
  publishedBy: string,
  visibility: 'private' | 'unlisted' | 'public' = 'public'
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];

  for (const sceneId of sceneIds) {
    try {
      await publishScene({ sceneId, publishedBy, visibility });
      success.push(sceneId);
    } catch (error) {
      console.error(`Failed to publish scene ${sceneId}:`, error);
      failed.push(sceneId);
    }
  }

  return { success, failed };
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

async function validateSceneForPublishing(scene: any): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if scene has content
  if (!scene.content || scene.content.trim().length === 0) {
    errors.push('Scene has no content');
  }

  // Check minimum word count
  if (scene.wordCount < 100) {
    warnings.push(`Scene is very short (${scene.wordCount} words)`);
  }

  // Check if title exists
  if (!scene.title || scene.title.trim().length === 0) {
    errors.push('Scene has no title');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export async function getScenePublishStatus(sceneId: string): Promise<{
  isPublished: boolean;
  publishedAt?: Date;
  visibility?: string;
  scheduledFor?: Date;
  canPublish: boolean;
  validationErrors?: string[];
}> {
  const [scene] = await db
    .select()
    .from(scenes)
    .where(eq(scenes.id, sceneId))
    .limit(1);

  if (!scene) {
    throw new Error('Scene not found');
  }

  const validation = await validateSceneForPublishing(scene);

  return {
    isPublished: !!scene.publishedAt,
    publishedAt: scene.publishedAt || undefined,
    visibility: scene.visibility,
    scheduledFor: scene.scheduledFor || undefined,
    canPublish: validation.isValid,
    validationErrors: validation.errors.length > 0 ? validation.errors : undefined,
  };
}
```

---

## Manual Status Control

### Quick Actions Component

**Location:** `src/components/publish/QuickActions.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface QuickActionsProps {
  sceneId?: string;
  chapterId?: string;
  currentStatus: 'writing' | 'published';
  currentVisibility?: 'private' | 'unlisted' | 'public';
  onStatusChange?: () => void;
}

export function QuickActions({
  sceneId,
  chapterId,
  currentStatus,
  currentVisibility = 'private',
  onStatusChange,
}: QuickActionsProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      const endpoint = sceneId
        ? `/api/publish/scenes/${sceneId}`
        : `/api/publish/chapters/${chapterId}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: 'public' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish');
      }

      toast.success(sceneId ? 'Scene published!' : 'Chapter published!');
      onStatusChange?.();
      router.refresh();
    } catch (error) {
      console.error('Publish error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setIsUnpublishing(true);

    try {
      const endpoint = sceneId
        ? `/api/publish/scenes/${sceneId}/unpublish`
        : `/api/publish/chapters/${chapterId}/unpublish`;

      const response = await fetch(endpoint, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unpublish');
      }

      toast.success(sceneId ? 'Scene unpublished' : 'Chapter unpublished');
      onStatusChange?.();
      router.refresh();
    } catch (error) {
      console.error('Unpublish error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to unpublish');
    } finally {
      setIsUnpublishing(false);
    }
  };

  const handleVisibilityChange = async (visibility: 'private' | 'unlisted' | 'public') => {
    try {
      const endpoint = sceneId
        ? `/api/publish/scenes/${sceneId}/visibility`
        : `/api/publish/chapters/${chapterId}/visibility`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update visibility');
      }

      toast.success(`Visibility updated to ${visibility}`);
      setShowVisibilityMenu(false);
      onStatusChange?.();
      router.refresh();
    } catch (error) {
      console.error('Visibility error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update visibility');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {currentStatus === 'writing' ? (
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-colors',
            'bg-green-600 text-white hover:bg-green-700',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center gap-2'
          )}
        >
          {isPublishing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              🚀 Publish Now
            </>
          )}
        </button>
      ) : (
        <>
          <div className="relative">
            <button
              onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
              className="px-4 py-2 rounded-lg font-medium border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              {currentVisibility === 'public' && '🌍 Public'}
              {currentVisibility === 'unlisted' && '🔗 Unlisted'}
              {currentVisibility === 'private' && '🔒 Private'}
              <span className="text-xs">▼</span>
            </button>

            {showVisibilityMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowVisibilityMenu(false)}
                />
                <div className="absolute top-full mt-2 right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[200px]">
                  <button
                    onClick={() => handleVisibilityChange('public')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
                  >
                    🌍 Public
                    <span className="text-xs text-gray-500 ml-auto">Visible to all</span>
                  </button>
                  <button
                    onClick={() => handleVisibilityChange('unlisted')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    🔗 Unlisted
                    <span className="text-xs text-gray-500 ml-auto">Link only</span>
                  </button>
                  <button
                    onClick={() => handleVisibilityChange('private')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 rounded-b-lg"
                  >
                    🔒 Private
                    <span className="text-xs text-gray-500 ml-auto">Only you</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleUnpublish}
            disabled={isUnpublishing}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              'border-2 border-red-300 dark:border-red-600 text-red-600 dark:text-red-400',
              'hover:bg-red-50 dark:hover:bg-red-900/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center gap-2'
            )}
          >
            {isUnpublishing ? (
              <>
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                Unpublishing...
              </>
            ) : (
              <>
                ⬇️ Unpublish
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
```

---

## Timeline Visualization

### Timeline Calendar Component

**Location:** `src/components/publish/PublishTimeline.tsx`

```typescript
'use client';

import { useState, useMemo } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils/cn';

interface TimelineEvent {
  id: string;
  sceneId?: string;
  chapterId?: string;
  title: string;
  date: Date;
  status: 'published' | 'scheduled' | 'pending' | 'failed';
  type: 'scene' | 'chapter';
}

interface PublishTimelineProps {
  events: TimelineEvent[];
  startDate?: Date;
  endDate?: Date;
  onEventClick?: (event: TimelineEvent) => void;
  onDateClick?: (date: Date) => void;
  onReschedule?: (eventId: string, newDate: Date) => void;
}

export function PublishTimeline({
  events,
  startDate = new Date(),
  endDate,
  onEventClick,
  onDateClick,
  onReschedule,
}: PublishTimelineProps) {
  const [currentMonth, setCurrentMonth] = useState(startDate);
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [draggedEvent, setDraggedEvent] = useState<TimelineEvent | null>(null);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, TimelineEvent[]>();

    events.forEach(event => {
      const dateKey = format(event.date, 'yyyy-MM-dd');
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(event);
    });

    return grouped;
  }, [events]);

  const handleDragStart = (event: TimelineEvent) => {
    setDraggedEvent(event);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (date: Date) => {
    if (draggedEvent && onReschedule) {
      onReschedule(draggedEvent.id, date);
      setDraggedEvent(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500 dark:bg-green-600';
      case 'scheduled':
        return 'bg-blue-500 dark:bg-blue-600';
      case 'pending':
        return 'bg-yellow-500 dark:bg-yellow-600';
      case 'failed':
        return 'bg-red-500 dark:bg-red-600';
      default:
        return 'bg-gray-500 dark:bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return '✅';
      case 'scheduled':
        return '📅';
      case 'pending':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '📝';
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const today = new Date();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Publishing Timeline
          </h2>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              )}
            >
              📅 Calendar
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                viewMode === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              )}
            >
              📊 Timeline
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            ← Previous
          </button>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>

          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="p-6">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDate.get(dateKey) || [];
              const isToday = isSameDay(day, today);
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'min-h-[100px] p-2 rounded-lg border-2 transition-colors',
                    isCurrentMonth
                      ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      : 'border-transparent bg-gray-50 dark:bg-gray-900',
                    isToday && 'border-blue-500 dark:border-blue-400',
                    'hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer'
                  )}
                  onClick={() => onDateClick?.(day)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(day)}
                >
                  {/* Date number */}
                  <div className={cn(
                    'text-sm font-medium mb-1',
                    isCurrentMonth
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-400 dark:text-gray-600',
                    isToday && 'text-blue-600 dark:text-blue-400 font-bold'
                  )}>
                    {format(day, 'd')}
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        draggable
                        onDragStart={() => handleDragStart(event)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        className={cn(
                          'text-xs px-2 py-1 rounded text-white truncate cursor-move',
                          getStatusColor(event.status)
                        )}
                        title={event.title}
                      >
                        {getStatusIcon(event.status)} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline View (Gantt-style) */}
      {viewMode === 'timeline' && (
        <div className="p-6 overflow-x-auto">
          <TimelineGantt
            events={events}
            startDate={startDate}
            endDate={endDate || addDays(startDate, 90)}
            onEventClick={onEventClick}
          />
        </div>
      )}

      {/* Legend */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-gray-700 dark:text-gray-300">Published</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-gray-700 dark:text-gray-300">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span className="text-gray-700 dark:text-gray-300">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-gray-700 dark:text-gray-300">Failed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Gantt-style timeline component
function TimelineGantt({
  events,
  startDate,
  endDate,
  onEventClick,
}: {
  events: TimelineEvent[];
  startDate: Date;
  endDate: Date;
  onEventClick?: (event: TimelineEvent) => void;
}) {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const totalDays = days.length;

  return (
    <div className="min-w-[800px]">
      {/* Timeline header */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 pb-2">
        <div className="w-48 flex-shrink-0 font-semibold text-gray-900 dark:text-gray-100">
          Content
        </div>
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${totalDays}, 1fr)` }}>
          {days.map((day, index) => (
            <div
              key={index}
              className="text-center text-xs text-gray-600 dark:text-gray-400 px-1"
            >
              {format(day, 'd')}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline rows */}
      <div className="space-y-2">
        {events.map((event) => {
          const eventDate = event.date;
          const dayIndex = days.findIndex(day => isSameDay(day, eventDate));

          if (dayIndex === -1) return null;

          return (
            <div key={event.id} className="flex items-center">
              <div className="w-48 flex-shrink-0 text-sm text-gray-700 dark:text-gray-300 pr-4 truncate">
                {event.title}
              </div>
              <div
                className="flex-1 grid relative"
                style={{ gridTemplateColumns: `repeat(${totalDays}, 1fr)` }}
              >
                <div
                  className={cn(
                    'absolute h-6 rounded cursor-pointer',
                    getStatusColor(event.status),
                    'hover:opacity-80 transition-opacity'
                  )}
                  style={{
                    left: `${(dayIndex / totalDays) * 100}%`,
                    width: `${(1 / totalDays) * 100}%`,
                  }}
                  onClick={() => onEventClick?.(event)}
                  title={`${event.title} - ${format(eventDate, 'MMM d, yyyy')}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  function getStatusColor(status: string) {
    switch (status) {
      case 'published':
        return 'bg-green-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }
}
```

---

## API Endpoints

### Scene Publishing API

#### POST `/api/publish/scenes/[sceneId]`
**Purpose:** Publish a scene immediately or schedule it

**Location:** `src/app/api/publish/scenes/[sceneId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { publishScene } from '@/lib/services/scene-publishing';

export async function POST(
  request: NextRequest,
  { params }: { params: { sceneId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sceneId } = params;
    const body = await request.json();
    const { visibility = 'public', scheduledFor } = body;

    await publishScene({
      sceneId,
      publishedBy: session.user.id,
      visibility,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to publish scene:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish scene' },
      { status: 500 }
    );
  }
}
```

#### POST `/api/publish/scenes/[sceneId]/unpublish`
**Purpose:** Unpublish a scene

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unpublishScene } from '@/lib/services/scene-publishing';

export async function POST(
  request: NextRequest,
  { params }: { params: { sceneId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sceneId } = params;

    await unpublishScene(sceneId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to unpublish scene:', error);
    return NextResponse.json(
      { error: 'Failed to unpublish scene' },
      { status: 500 }
    );
  }
}
```

### Schedule Management API

#### POST `/api/publish/schedules`
**Purpose:** Create a new publishing schedule

**Location:** `src/app/api/publish/schedules/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createPublishingSchedule } from '@/lib/services/publishing';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      storyId,
      chapterId,
      name,
      description,
      scheduleType,
      startDate,
      endDate,
      publishTime,
      intervalDays,
      daysOfWeek,
      scenesPerPublish,
    } = body;

    const scheduleId = await createPublishingSchedule({
      storyId,
      chapterId,
      createdBy: session.user.id,
      name,
      description,
      scheduleType,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      publishTime,
      intervalDays,
      daysOfWeek,
      scenesPerPublish,
    });

    return NextResponse.json({ scheduleId }, { status: 201 });
  } catch (error) {
    console.error('Failed to create schedule:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

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

    // Get schedules
    let query = db
      .select()
      .from(publishingSchedules)
      .where(eq(publishingSchedules.createdBy, session.user.id));

    if (storyId) {
      query = query.where(eq(publishingSchedules.storyId, storyId));
    }

    const schedules = await query.orderBy(desc(publishingSchedules.createdAt));

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Failed to fetch schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}
```

#### GET `/api/publish/timeline`
**Purpose:** Get timeline events for calendar display

**Location:** `src/app/api/publish/timeline/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scheduledPublications, scenes, chapters, stories } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get user's stories
    const userStories = await db
      .select({ id: stories.id })
      .from(stories)
      .where(eq(stories.authorId, session.user.id));

    const storyIds = userStories.map(s => s.id);

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
      .where(
        sql`${scheduledPublications.storyId} IN (${sql.join(storyIds.map(id => sql`${id}`), sql`, `)})`
      );

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

---

## Component Implementation

### Schedule Builder Component

**Location:** `src/components/publish/ScheduleBuilder.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

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
    scheduleType: 'daily' as 'daily' | 'weekly' | 'custom' | 'one-time',
    startDate: '',
    endDate: '',
    publishTime: '09:00',
    intervalDays: 1,
    daysOfWeek: [] as number[],
    scenesPerPublish: 1,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedPublications, setEstimatedPublications] = useState(0);

  // Calculate estimated publications
  const calculateEstimate = () => {
    const { scheduleType, startDate, endDate, intervalDays, daysOfWeek, scenesPerPublish } = formData;

    if (!startDate) return 0;

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days default

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let publications = 0;

    switch (scheduleType) {
      case 'daily':
        publications = diffDays;
        break;
      case 'weekly':
        const weeksInRange = Math.floor(diffDays / 7);
        publications = weeksInRange * daysOfWeek.length;
        break;
      case 'custom':
        publications = Math.floor(diffDays / intervalDays);
        break;
      case 'one-time':
        publications = 1;
        break;
    }

    const totalPublications = Math.min(publications, Math.ceil(totalScenes / scenesPerPublish));
    setEstimatedPublications(totalPublications);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/publish/schedules', {
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

  const toggleDayOfWeek = (day: number) => {
    setFormData(prev => {
      const daysOfWeek = prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort();
      return { ...prev, daysOfWeek };
    });
  };

  const weekDays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Create Publishing Schedule
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Automate your publishing workflow with a custom schedule for {totalScenes} scenes.
        </p>
      </div>

      {/* Schedule Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Schedule Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="e.g., Weekly Chapter Release"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          rows={3}
          placeholder="Add notes about this schedule..."
        />
      </div>

      {/* Schedule Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Schedule Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: 'daily', label: 'Daily', icon: '📅', desc: 'Publish every day' },
            { value: 'weekly', label: 'Weekly', icon: '🗓️', desc: 'Specific days' },
            { value: 'custom', label: 'Custom', icon: '⚙️', desc: 'Every N days' },
            { value: 'one-time', label: 'One-Time', icon: '🎯', desc: 'Single date' },
          ].map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFormData({ ...formData, scheduleType: type.value as any })}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-left',
                formData.scheduleType === type.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
              )}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{type.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Days of Week (Weekly only) */}
      {formData.scheduleType === 'weekly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Days of Week
          </label>
          <div className="flex gap-2">
            {weekDays.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDayOfWeek(day.value)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-colors',
                  formData.daysOfWeek.includes(day.value)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                )}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interval Days (Custom only) */}
      {formData.scheduleType === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Publish Every N Days
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={formData.intervalDays}
            onChange={(e) => setFormData({ ...formData, intervalDays: parseInt(e.target.value) })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => {
              setFormData({ ...formData, startDate: e.target.value });
              calculateEstimate();
            }}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        {formData.scheduleType !== 'one-time' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => {
                setFormData({ ...formData, endDate: e.target.value });
                calculateEstimate();
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        )}
      </div>

      {/* Publish Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Publish Time
        </label>
        <input
          type="time"
          value={formData.publishTime}
          onChange={(e) => setFormData({ ...formData, publishTime: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          required
        />
      </div>

      {/* Scenes Per Publish */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Scenes Per Publication
        </label>
        <input
          type="number"
          min="1"
          max={totalScenes}
          value={formData.scenesPerPublish}
          onChange={(e) => {
            setFormData({ ...formData, scenesPerPublish: parseInt(e.target.value) });
            calculateEstimate();
          }}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          How many scenes to publish each time
        </p>
      </div>

      {/* Estimate */}
      {estimatedPublications > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Estimated:</strong> {estimatedPublications} publications will be scheduled
            {formData.endDate && ` from ${formData.startDate} to ${formData.endDate}`}
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onComplete}
          className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            'Create Schedule'
          )}
        </button>
      </div>
    </form>
  );
}
```

---

## Responsive Mobile Design

### Mobile Publishing Dashboard

**Layout Adaptations:**

**Desktop (≥ 1024px):**
- Full calendar view
- Side-by-side schedule list
- Drag-and-drop rescheduling

**Tablet (768px - 1023px):**
- Stacked calendar and schedules
- Simplified timeline
- Touch-friendly controls

**Mobile (< 768px):**
- Compact calendar (week view)
- List view for schedules
- Bottom sheet for schedule creation
- Swipe gestures for navigation

### Mobile Components

#### Mobile Schedule List
**Location:** `src/components/publish/MobileScheduleList.tsx`

```typescript
'use client';

import { format } from 'date-fns';
import { cn } from '@/lib/utils/cn';

interface Schedule {
  id: string;
  name: string;
  scheduleType: string;
  nextPublishAt: Date | null;
  totalPublished: number;
  isActive: boolean;
}

interface MobileScheduleListProps {
  schedules: Schedule[];
  onScheduleClick?: (schedule: Schedule) => void;
}

export function MobileScheduleList({ schedules, onScheduleClick }: MobileScheduleListProps) {
  return (
    <div className="space-y-3">
      {schedules.map((schedule) => (
        <button
          key={schedule.id}
          onClick={() => onScheduleClick?.(schedule)}
          className="w-full text-left p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg active:scale-98 transition-transform"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {schedule.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {schedule.scheduleType === 'daily' && '📅 Daily'}
                {schedule.scheduleType === 'weekly' && '🗓️ Weekly'}
                {schedule.scheduleType === 'custom' && '⚙️ Custom'}
                {schedule.scheduleType === 'one-time' && '🎯 One-Time'}
              </p>
            </div>
            <span className={cn(
              'px-2 py-1 rounded text-xs font-medium',
              schedule.isActive
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            )}>
              {schedule.isActive ? 'Active' : 'Paused'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {schedule.totalPublished} published
            </span>
            {schedule.nextPublishAt && (
              <span className="text-blue-600 dark:text-blue-400">
                Next: {format(schedule.nextPublishAt, 'MMM d')}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
```

### Mobile Optimizations

```css
/* Mobile publishing styles */
@media (max-width: 768px) {
  /* Calendar becomes compact week view */
  .timeline-calendar {
    @apply overflow-x-auto;
  }

  .calendar-day {
    @apply min-w-[50px];
  }

  /* Schedule builder becomes bottom sheet */
  .schedule-builder {
    @apply fixed inset-x-0 bottom-0 rounded-t-2xl;
    max-height: 90vh;
  }

  /* Touch-friendly buttons */
  .publish-button {
    @apply min-h-[48px] text-base;
  }

  /* Simplified timeline view */
  .timeline-gantt {
    @apply hidden; /* Hide Gantt on mobile */
  }

  /* List view for scheduled items */
  .scheduled-list {
    @apply block;
  }
}
```

---

## Automation & Background Jobs

### Publishing Automation Service

**Location:** `src/lib/services/publish-automation.ts`

```typescript
import { db } from '@/lib/db';
import { scheduledPublications, publishingSchedules } from '@/lib/db/schema';
import { eq, lte, and } from 'drizzle-orm';
import { publishScene } from './scene-publishing';

export async function processScheduledPublications(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const now = new Date();

  // Get pending publications due now
  const pendingPublications = await db
    .select()
    .from(scheduledPublications)
    .where(
      and(
        eq(scheduledPublications.status, 'pending'),
        lte(scheduledPublications.scheduledFor, now)
      )
    )
    .limit(100); // Process in batches

  let succeeded = 0;
  let failed = 0;

  for (const publication of pendingPublications) {
    try {
      // Publish the scene
      if (publication.sceneId) {
        await publishScene({
          sceneId: publication.sceneId,
          publishedBy: 'system', // Or get from schedule creator
          visibility: 'public',
        });
      } else if (publication.chapterId) {
        // Handle chapter publishing
        // TODO: Implement chapter publishing
      }

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

      succeeded++;
    } catch (error) {
      console.error(`Failed to publish ${publication.id}:`, error);

      // Mark as failed
      await db
        .update(scheduledPublications)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          retryCount: sql`${scheduledPublications.retryCount} + 1`,
          updatedAt: now,
        })
        .where(eq(scheduledPublications.id, publication.id));

      failed++;
    }
  }

  return {
    processed: pendingPublications.length,
    succeeded,
    failed,
  };
}
```

---

## Implementation Plan

### Phase 1: Database & Scene Publishing (Week 1)
**Tasks:**
1. Run database migrations for scenes publishing fields
2. Create publishing_schedules table
3. Create scheduled_publications table
4. Update Drizzle schema
5. Implement scene publishing service
6. Create scene publishing API endpoints
7. Test scene publishing workflow

**Deliverables:**
- Database fully set up
- Scene publishing functional
- API endpoints working

### Phase 2: Schedule Builder & Automation (Week 2)
**Tasks:**
1. Implement schedule creation service
2. Build schedule builder UI component
3. Create schedule management API
4. Implement publication automation service
5. Test automated publishing
6. Add error handling and retries

**Deliverables:**
- Schedule creation working
- Automated publishing functional

### Phase 3: Timeline Visualization (Week 3)
**Tasks:**
1. Implement calendar timeline component
2. Create Gantt-style timeline view
3. Add drag-and-drop rescheduling
4. Implement timeline API endpoint
5. Add filtering and date navigation
6. Mobile calendar optimization
7. Test timeline interactions

**Deliverables:**
- Beautiful calendar visualization
- Interactive timeline
- Drag-and-drop working

### Phase 4: Manual Controls & UI Polish (Week 4)
**Tasks:**
1. Implement quick actions component
2. Add bulk publishing functionality
3. Create status history tracking
4. Build mobile schedule list
5. Add bottom sheet for mobile
6. Implement swipe gestures
7. Polish animations and transitions

**Deliverables:**
- Quick publish/unpublish actions
- Bulk operations working
- Mobile-optimized UI

### Phase 5: Testing & Documentation (Week 5)
**Tasks:**
1. Write unit tests for services
2. Write integration tests for APIs
3. E2E tests with Playwright
4. Performance testing
5. Mobile device testing
6. Documentation updates
7. User guide creation

**Deliverables:**
- Comprehensive test coverage
- Performance benchmarks met
- Complete documentation

---

## Success Metrics

### Feature Adoption
- **Schedule Usage:** % of writers using schedules
- **Automation Rate:** % of publications via automation vs manual
- **Scene Publishing:** % of stories using scene-by-scene publishing
- **Mobile Usage:** % of publish actions from mobile

### Publishing Efficiency
- **Time to Publish:** Average time from "ready" to "published"
- **Batch Publishing:** Average scenes published per schedule
- **Publishing Success Rate:** % of scheduled publications that succeed
- **Reschedule Rate:** % of publications that get rescheduled

### Technical Metrics
- **API Response Time:** < 500ms for publish actions
- **Timeline Load Time:** < 2s on mobile
- **Background Job Lag:** < 5 minutes from scheduled time

---

## Future Enhancements

### Advanced Scheduling
- **Conditional Publishing:** Publish based on metrics (e.g., when previous chapter reaches 1000 views)
- **Smart Scheduling:** AI-powered optimal publish time recommendations
- **Series Management:** Coordinate publishing across multiple stories
- **Pre-publish Checklist:** Customizable validation before publishing

### Collaboration Features
- **Multi-Author Schedules:** Coordinate with co-authors
- **Approval Workflows:** Require approval before publishing
- **Publishing Roles:** Different permissions for team members
- **Publishing Templates:** Reusable schedule templates

### Analytics Integration
- **Publishing Impact:** Track reader response to publishing schedule
- **Optimal Timing:** Analyze which publish times get best engagement
- **Schedule Performance:** Compare different schedule strategies
- **Predictive Analytics:** Forecast reader growth based on publishing frequency

---

## References

### Technical Documentation
- [Date-fns Documentation](https://date-fns.org/docs/Getting-Started)
- [React DnD](https://react-dnd.github.io/react-dnd/about)
- [Drizzle ORM Queries](https://orm.drizzle.team/docs/select)

### Design Patterns
- [Google Calendar Design](https://calendar.google.com/)
- [Notion Calendar](https://www.notion.so/product/calendar)
- [Trello Timeline](https://trello.com/en/guide/timeline-view)
- [Asana Timeline](https://asana.com/guide/help/premium/timeline)

### Publishing Platforms
- [Medium Publishing](https://medium.com/creators)
- [Substack Scheduling](https://support.substack.com/hc/en-us/articles/360037701292-How-do-I-schedule-a-post)
- [WordPress Scheduling](https://wordpress.com/support/posts/schedule-a-post/)
- [Wattpad Publishing](https://support.wattpad.com/hc/en-us/articles/201419974-Publishing-Your-Story)

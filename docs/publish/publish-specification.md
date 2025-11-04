---
title: Publishing & Scheduling Specification
description: Weekly scene-by-scene publishing system for novels and comics
status: 📋 Specification
---

# Publishing & Scheduling Specification

A streamlined publishing system designed for **weekly scene-by-scene releases** of novels and comics, with automated scheduling, manual controls, and beautiful timeline visualization.

---

## Table of Contents

1. [Overview](#overview)
2. [What: System Design](#what-system-design)
3. [Why: Strategic Rationale](#why-strategic-rationale)
4. [How: User Experience](#how-user-experience)
5. [Core Features](#core-features)
6. [Data Model](#data-model)
7. [Success Metrics](#success-metrics)

---

## Overview

### The Problem

Writers on platforms like Wattpad and Royal Road struggle with:
- **Inconsistent publishing** - Sporadic releases hurt audience retention
- **Manual overhead** - Publishing individual chapters/scenes is time-consuming
- **No visibility** - Hard to plan and visualize release schedules
- **Poor timing** - Random release times miss peak engagement windows

### The Solution

A **weekly scene-by-scene publishing system** that:
- ✅ Automates scene releases on a consistent weekly schedule
- ✅ Provides beautiful timeline visualization for planning
- ✅ Maintains scene-level granularity (novels) and panel-level granularity (comics)
- ✅ Offers manual publish/unpublish controls for flexibility
- ✅ Uses Vercel cron jobs for reliable automation

### Key Innovation

**Scene-level scheduling** instead of chapter-level:
- More granular control for serialization
- Better pacing for reader engagement
- Natural fit for platform's scene-based story structure
- Enables drip-feed content strategy

---

## What: System Design

### Core Components

#### 1. Publishing Schedule Creator
- **Input**: Story/chapter selection, weekly time slot, number of scenes per week
- **Output**: Automated publishing schedule with timeline preview
- **Constraint**: Weekly releases only (no daily/bi-weekly)

#### 2. Scene Publication Queue
- **Storage**: Database table tracking pending/published scenes
- **Automation**: Vercel cron job checks queue daily, publishes scenes at scheduled time
- **Status Tracking**: pending → published → failed (with retry logic)

#### 3. Timeline Calendar
- **Visualization**: Monthly calendar showing scheduled/published scenes
- **Interaction**: Drag-and-drop rescheduling, click to view scene details
- **Filtering**: By story, status (published/scheduled/pending), date range

#### 4. Manual Controls
- **Quick Actions**: One-click publish/unpublish for individual scenes
- **Bulk Operations**: Select multiple scenes for batch publish/unpublish
- **Visibility Modes**: private (draft) → unlisted (link-only) → public (published)

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Publishing System                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐         │
│  │  Schedule        │        │  Publication     │         │
│  │  Creator UI      │───────▶│  Queue (DB)      │         │
│  └──────────────────┘        └──────────────────┘         │
│                                      │                      │
│                                      ▼                      │
│  ┌──────────────────┐        ┌──────────────────┐         │
│  │  Timeline        │◀───────│  Vercel Cron     │         │
│  │  Visualization   │        │  Job (Daily)     │         │
│  └──────────────────┘        └──────────────────┘         │
│                                      │                      │
│                                      ▼                      │
│  ┌──────────────────┐        ┌──────────────────┐         │
│  │  Manual          │        │  Publish API     │         │
│  │  Controls        │───────▶│  Endpoints       │         │
│  └──────────────────┘        └──────────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Why: Strategic Rationale

### Web Fiction Industry Best Practices

**Research from Wattpad, Royal Road, and Substack serialization:**

#### Weekly Publishing Wins
- **Audience Retention**: Weekly schedule creates anticipation and habit-forming engagement
- **Sustainable Pace**: Writers can maintain quality without burnout
- **Community Building**: Readers have time to discuss between releases
- **SEO Benefits**: Regular publishing improves search visibility

> "Consistency begets audience growth and retention; people like to know exactly when they're getting their next piece of content before they become invested." - Serial Fiction Best Practices, 2025

#### Optimal Release Strategy
- **Day**: Monday or Friday (highest engagement)
- **Time**: 9:00 AM local time (catches morning readers)
- **Length**: 1,200-1,500 words per scene (10-minute read)
- **Buffer**: Maintain 6-10 unpublished scenes ahead of schedule

### Platform-Specific Benefits

#### For Writers
- ✅ **Set and forget**: Schedule weeks/months in advance
- ✅ **Focus on writing**: Automation handles publishing logistics
- ✅ **Flexible control**: Override automation anytime with manual controls
- ✅ **Visual planning**: Timeline shows entire publication roadmap

#### For Readers
- ✅ **Predictable releases**: Know exactly when new content arrives
- ✅ **Quality content**: Writers have time to polish before publishing
- ✅ **Community engagement**: Weekly discussion cycles form around releases
- ✅ **Binge-friendly**: Published scenes remain accessible forever

#### For Platform
- ✅ **Retention**: Consistent publishing = consistent traffic
- ✅ **Growth**: Happy writers attract more writers
- ✅ **Engagement**: Weekly releases drive comment/like activity
- ✅ **Infrastructure**: Vercel cron jobs (free tier supports this use case)

---

## How: User Experience

### Writer Journey

#### Step 1: Create Publishing Schedule
1. Navigate to **Publish Center** (`/publish`)
2. Click **"Create Schedule"** button
3. Select story/chapter to publish
4. Configure schedule:
   - **Day of week**: Monday (or Friday)
   - **Time**: 9:00 AM (default, customizable)
   - **Scenes per week**: 1-3 scenes (default: 1)
   - **Start date**: Next available Monday
5. Preview timeline showing all scheduled publications
6. Click **"Create Schedule"** to activate automation

**Example Configuration:**
```yaml
Story: "The Last Garden"
Chapter: "Chapter 1: Ruins"
Schedule:
  - Day: Monday
  - Time: 09:00 AM
  - Scenes per week: 1
  - Start date: 2025-11-11
  - Estimated duration: 12 weeks (12 scenes)
```

#### Step 2: Monitor Timeline
- View **monthly calendar** showing:
  - ✅ Green dots: Published scenes
  - 📅 Blue dots: Scheduled scenes (future)
  - ⏳ Yellow dots: Pending scenes (awaiting publication)
  - ❌ Red dots: Failed publications (need attention)
- Click any date to see scene details
- Drag scenes to reschedule (updates queue automatically)

#### Step 3: Manual Override (Optional)
- **Quick publish**: Click scene → **"Publish Now"** button
- **Unpublish**: Click published scene → **"Unpublish"** button
- **Visibility toggle**: private → unlisted → public
- **Bulk actions**: Select multiple scenes → **"Publish Selected"** or **"Unpublish Selected"**

### Reader Experience

#### Discovering New Content
- **Community feed**: Shows newly published scenes from followed writers
- **Story page**: Displays publication schedule and next release date
- **Notifications**: Email/push notifications for new scene releases (opt-in)

#### Reading Experience
- Published scenes appear in story's reading interface
- Unpublished scenes hidden from readers (only visible to author)
- "Next scene releases: Monday, 9:00 AM" banner at end of latest published scene

---

## Core Features

### 1. Weekly Scene Scheduling

**What it does:**
- Automatically publishes scenes at specified day/time each week
- Processes publication queue using Vercel cron job (runs daily)
- Sends scenes from "pending" → "published" status at scheduled time

**User controls:**
- **Create schedule**: Set day of week, time, scenes per week, start date
- **Edit schedule**: Modify time/day without recreating entire schedule
- **Pause schedule**: Temporarily stop automation (manual publish still works)
- **Delete schedule**: Remove automation, keep scenes in draft state

**Technical implementation:**
- Database stores `publishingSchedules` (schedule metadata) and `scheduledPublications` (scene queue)
- Vercel cron job (`vercel.json`) runs daily at 8:00 AM UTC
- Cron job queries `scheduledPublications` for scenes due today
- Publishes scenes via `/publish/api/scenes/[id]` endpoint

### 2. Timeline Visualization

**Calendar View:**
- Monthly grid calendar (similar to Google Calendar)
- Color-coded scene status:
  - ✅ Green: Published
  - 📅 Blue: Scheduled
  - ⏳ Yellow: Pending
  - ❌ Red: Failed
- Hover to see scene title and publication time
- Click date to see all scenes scheduled that day
- Navigate months: Previous/Next buttons, date picker

**List View (Mobile):**
- Vertical list of upcoming publications
- Compact scene cards with status badges
- Pull-to-refresh for latest data
- Filter by story/status

**Interaction Features:**
- **Drag-and-drop**: Reschedule scenes by dragging to new date
- **Quick actions**: Right-click scene → Publish Now / Unpublish / Edit
- **Bulk select**: Checkbox mode for multi-scene operations

### 3. Manual Publish Controls

**Quick Actions:**
```typescript
// Scene-level controls
- Publish Now: Immediately publish scene (bypasses schedule)
- Unpublish: Remove scene from public view (revert to draft)
- Change Visibility: private | unlisted | public

// Chapter-level controls
- Publish All Scenes: Publish all scenes in chapter at once
- Unpublish Chapter: Unpublish all chapter scenes

// Story-level controls
- Publish All: Publish entire story (all chapters/scenes)
- Unpublish Story: Unpublish entire story
```

**Visibility Modes:**
1. **Private** (draft): Only author can view
2. **Unlisted**: Accessible via direct link only (not in public feeds)
3. **Public**: Fully published, visible in community feeds and search

**Status Tracking:**
- Each scene tracks: `publishedAt`, `unpublishedAt`, `publishedBy` (user ID)
- Publishing history log: timestamps, actions, status changes
- Automatic status updates: `scene.status` = 'writing' | 'published'

### 4. Publication Queue Management

**Queue Operations:**
```typescript
// Queue states
enum PublicationStatus {
  pending = 'pending',     // Waiting for scheduled time
  published = 'published', // Successfully published
  failed = 'failed',       // Publication failed (needs retry)
  cancelled = 'cancelled'  // User cancelled publication
}

// Queue actions
- View queue: See all pending publications
- Cancel publication: Remove from queue (keeps scene as draft)
- Retry failed: Attempt re-publication of failed scenes
- Bulk cancel: Remove multiple publications from queue
```

**Error Handling:**
- **Failed publications**: Marked with red status, show error message
- **Automatic retry**: Failed publications retry up to 2 times (24 hours apart)
- **Manual retry**: User can manually trigger retry via UI
- **Notification**: Email alert for failed publications

---

## Data Model

### Database Tables

#### 1. `publishingSchedules`
Stores weekly publication schedules created by writers.

```typescript
interface PublishingSchedule {
  id: string;
  storyId: string;  // References stories.id
  chapterId?: string;  // Optional: limit schedule to specific chapter
  createdBy: string;  // User ID

  // Schedule configuration
  name: string;  // e.g., "Weekly Monday Release"
  description?: string;
  dayOfWeek: number;  // 0-6 (0 = Sunday, 1 = Monday, ..., 5 = Friday)
  publishTime: string;  // HH:MM format (e.g., "09:00")
  scenesPerWeek: number;  // Default: 1

  // Date range
  startDate: Date;
  endDate?: Date;  // Optional: auto-calculate based on available scenes

  // Status tracking
  isActive: boolean;  // Active/Paused
  isCompleted: boolean;  // All scenes published
  lastPublishedAt?: Date;
  nextPublishAt?: Date;  // Next scheduled publication time
  totalPublished: number;  // Count of published scenes

  createdAt: Date;
  updatedAt: Date;
}
```

**Example:**
```javascript
{
  id: "sched_abc123",
  storyId: "story_xyz789",
  chapterId: null,  // Applies to all chapters
  createdBy: "user_john",

  name: "Weekly Monday Morning Release",
  description: "Publish 1 scene every Monday at 9 AM",
  dayOfWeek: 1,  // Monday
  publishTime: "09:00",
  scenesPerWeek: 1,

  startDate: "2025-11-11T00:00:00Z",
  endDate: null,  // Publish until no scenes remain

  isActive: true,
  isCompleted: false,
  lastPublishedAt: "2025-11-11T09:00:00Z",
  nextPublishAt: "2025-11-18T09:00:00Z",
  totalPublished: 1,

  createdAt: "2025-11-04T10:30:00Z",
  updatedAt: "2025-11-11T09:01:00Z"
}
```

#### 2. `scheduledPublications`
Queue of individual scenes scheduled for publication.

```typescript
interface ScheduledPublication {
  id: string;
  scheduleId?: string;  // References publishingSchedules.id (null for manual scheduling)
  storyId: string;  // References stories.id
  chapterId?: string;  // References chapters.id
  sceneId: string;  // References scenes.id

  // Scheduling
  scheduledFor: Date;  // Exact publication date/time
  publishedAt?: Date;  // Actual publication timestamp

  // Status
  status: 'pending' | 'published' | 'failed' | 'cancelled';
  errorMessage?: string;  // Error details if failed
  retryCount: number;  // Automatic retry attempts

  createdAt: Date;
  updatedAt: Date;
}
```

**Example:**
```javascript
{
  id: "pub_def456",
  scheduleId: "sched_abc123",
  storyId: "story_xyz789",
  chapterId: "ch_001",
  sceneId: "scene_001",

  scheduledFor: "2025-11-11T09:00:00Z",
  publishedAt: "2025-11-11T09:00:15Z",  // Published successfully

  status: "published",
  errorMessage: null,
  retryCount: 0,

  createdAt: "2025-11-04T10:30:00Z",
  updatedAt: "2025-11-11T09:00:15Z"
}
```

#### 3. Updated `scenes` Table
Add publishing fields to existing scenes table.

```typescript
// Existing scenes table + new fields
interface Scene {
  // ... existing fields (id, chapterId, title, content, etc.)

  // Publishing fields
  publishedAt?: Date;  // When scene was published
  scheduledFor?: Date;  // When scene is scheduled to publish
  visibility: 'private' | 'unlisted' | 'public';  // Visibility mode
  publishedBy?: string;  // User ID who published
  unpublishedAt?: Date;  // When scene was unpublished
  unpublishedBy?: string;  // User ID who unpublished
}
```

**Database Migration:**
```sql
-- Add publishing fields to scenes table
ALTER TABLE scenes
  ADD COLUMN published_at TIMESTAMP,
  ADD COLUMN scheduled_for TIMESTAMP,
  ADD COLUMN visibility VARCHAR(20) DEFAULT 'private' NOT NULL,
  ADD COLUMN published_by TEXT REFERENCES users(id),
  ADD COLUMN unpublished_at TIMESTAMP,
  ADD COLUMN unpublished_by TEXT REFERENCES users(id);

-- Create indexes for performance
CREATE INDEX idx_scenes_published_at ON scenes(published_at);
CREATE INDEX idx_scenes_scheduled_for ON scenes(scheduled_for);
CREATE INDEX idx_scenes_visibility ON scenes(visibility);
```

---

## Success Metrics

### Feature Adoption
- **Schedule Usage**: % of writers using automated schedules (target: 40%+)
- **Scene Publishing**: % of stories using scene-by-scene publishing (target: 60%+)
- **Consistency**: % of schedules maintained for 4+ weeks (target: 70%+)

### Publishing Efficiency
- **Time to Publish**: Average time from "ready" to "published" (target: < 5 minutes manual, instant automated)
- **Publishing Success Rate**: % of scheduled publications that succeed (target: 99%+)
- **Automation Adoption**: % of publications via automation vs manual (target: 70% automated)

### Audience Impact
- **Reader Retention**: % of readers returning after 4 weeks (target: 60%+)
- **Engagement Rate**: Comments/likes per published scene (target: 5%+)
- **Binge Reading**: % of readers reading 3+ scenes in one session (target: 40%+)

### Technical Performance
- **API Response Time**: Publish endpoint < 500ms (target: < 300ms)
- **Timeline Load Time**: Calendar page load < 2s (target: < 1.5s)
- **Cron Job Reliability**: 99.9%+ successful execution (target: 100%)

---

## Related Documents

- **📋 Development Guide**: `publish-development.md` - Implementation details and API specifications
- **📖 Novels Specification**: `../novels/novels-specification.md` - Scene-based story structure
- **🎨 Comics Specification**: `../comics/comics-architecture.md` - Panel-based comic structure

---

**Status**: 📋 Specification
**Last Updated**: 2025-11-04
**Next Steps**: See `publish-development.md` for implementation guide

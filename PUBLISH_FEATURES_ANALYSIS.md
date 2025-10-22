# Fictures Publishing Features - Comprehensive Analysis

## Executive Summary

The Fictures codebase has **basic publishing infrastructure** with:
- Immediate chapter publishing
- Chapter scheduling fields (database schema)
- Publishing history and analytics tracking
- Scene evaluation API for content quality assessment

However, **scene-by-scene publishing**, **detailed scheduling features**, and **timeline visualization** are **NOT yet implemented**.

---

## 1. Current Publishing Architecture

### 1.1 Database Schema (Published Fields)

**Chapters Table** - Key publishing fields:
```typescript
// src/lib/db/schema.ts (lines 125-150)
chapters table:
  - status: statusEnum ('writing' | 'published') - REQUIRED
  - publishedAt: timestamp - OPTIONAL (when published)
  - scheduledFor: timestamp - OPTIONAL (future publish date)
```

**Scenes Table** - NO publishing fields:
```typescript
// src/lib/db/schema.ts (lines 152-176)
scenes table:
  - status: varchar (OPTIONAL, used for content progress)
  - No publishedAt field
  - No scheduledFor field
  - No publish-specific metadata
```

**Issue**: Scenes lack dedicated publishing fields needed for scene-by-scene publishing.

---

## 2. Current Publishing Features (Implemented)

### 2.1 Chapter Publishing API

**File**: `src/app/api/chapters/[id]/publish/route.ts`

```typescript
POST /api/chapters/[id]/publish
- Publishes a single chapter
- Requirements:
  * Chapter must have at least one scene
  * At least one scene must have content
  * User must own the story
- Actions:
  * Sets chapter.status = 'published'
  * Sets chapter.publishedAt = current timestamp
  * Returns updated chapter
```

**Validation Logic**:
```typescript
// Lines 21-39
const chapterScenes = await db.select().from(scenes)
  .where(eq(scenes.chapterId, chapterId));

if (chapterScenes.length === 0) {
  return error 'Cannot publish chapter without scenes'
}

const scenesWithContent = chapterScenes.filter(scene => 
  scene.content && scene.content.trim().length > 0
);

if (scenesWithContent.length === 0) {
  return error 'Cannot publish chapter with empty scenes'
}
```

### 2.2 Chapter Unpublish API

**File**: `src/app/api/chapters/[id]/unpublish/route.ts`

```typescript
POST /api/chapters/[id]/unpublish
- Reverts a published chapter to writing state
- Actions:
  * Sets chapter.status = 'writing'
  * Sets chapter.publishedAt = undefined
  * Does NOT delete data
```

### 2.3 Publishing Status API

**File**: `src/app/api/publish/status/route.ts`

```typescript
GET /api/publish/status
- Returns publish readiness status
- Data:
  * scheduledItems: Mock data (4 items) with statuses
  * readyToPublish: First user chapter with metadata
  * pending: Count of chapters in 'writing' status
```

**Current Implementation**: Returns mock data based on user's chapters. Not using schedule information.

### 2.4 Publishing History API

**File**: `src/app/api/publish/history/route.ts`

```typescript
GET /api/publish/history
- Lists published chapters
- Filters: chapters where publishedAt is NOT NULL
- Returns:
  * publications array with mock engagement stats
  * totalPublished count
  * thisMonth count
```

**Note**: engagement metrics are MOCK DATA (random numbers).

### 2.5 Publishing Analytics API

**File**: `src/app/api/publish/analytics/route.ts`

```typescript
GET /api/publish/analytics
- Returns analytics for latest published chapter
- Returns:
  * Mock views, comments, reactions, ratings
  * Mock engagement rate
  * Mock trending rank
  * Pre-publish buzz metrics (MOCK)
  * Optimal publish time (MOCK)
```

---

## 3. Publishing UI Components

### 3.1 Publication Center Page

**File**: `src/app/publish/page.tsx`

- Main publish hub at `/publish` route
- Displays PublishClient component
- Minimal wrapper with layout

### 3.2 PublishClient Component

**File**: `src/components/publish/PublishClient.tsx` (460 lines)

**Features**:
1. **Publishing Schedule Card**
   - Shows upcoming 4 scheduled items
   - Displays: date, title, time, status badge
   - Statuses: 'ready', 'draft', 'planned', 'idea'
   - No actual interaction with schedule

2. **Quick Publish Card**
   - Shows first ready-to-publish chapter
   - Metadata: word count, target, title
   - Preview text
   - Schedule options (radio buttons):
     * Publish Now
     * Schedule for specific time
     * Save as Draft
   - Community features:
     * Enable comments
     * Allow theories
     * Notify subscribers
     * Community poll
   - Buttons: Preview, Edit, Publish, Save Draft

3. **Analytics Section**
   - Publication Analytics Card
     * Latest chapter performance
     * Views, comments, reactions, rating
     * Engagement rate
     * Trending rank
   - Reader Engagement Card
     * Pre-publish buzz metrics
     * Optimal publish time

**Loading States**: Skeleton loaders for all sections
**Error Handling**: Error state with retry button

### 3.3 PublishingSchedule Dashboard Component

**File**: `src/components/dashboard/PublishingSchedule.tsx`

- Compact version for dashboard
- Shows fallback schedule items
- Minimal interaction

---

## 4. Data Fetching & Caching

**File**: `src/lib/hooks/use-page-cache.ts`

```typescript
// Lines 168-209
export function usePublishStatus() {
  return usePersistedSWR(
    '/api/publish/status',
    fetcher,
    CACHE_CONFIGS.publish,
    {
      revalidateOnFocus: true,
      errorRetryCount: 2,
      onSuccess: (data) => {
        console.log('✅ Publish status loaded:', data?.pending || 0, 'pending publications');
      }
    }
  );
}

export function usePublishHistory() {
  return usePersistedSWR(
    '/api/publish/history',
    fetcher,
    CACHE_CONFIGS.publish,
    {
      revalidateOnFocus: false,
      refreshInterval: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function usePublishAnalytics() {
  return usePersistedSWR(
    '/api/publish/analytics',
    fetcher,
    CACHE_CONFIGS.analytics,
    {
      revalidateOnFocus: false,
      refreshInterval: 2 * 60 * 1000, // 2 minutes
    }
  );
}
```

**Caching Strategy**: SWR with localStorage persistence and configurable refresh intervals.

---

## 5. Scene Evaluation Feature (NEW)

**File**: `src/app/api/evaluate/scene/route.ts`

### 5.1 Scene Evaluation API

```typescript
POST /api/evaluate/scene
- Evaluates a single scene using Architectonics of Engagement
- Authentication: Supports session + API key (dual auth)
- Scope: Requires 'stories:read' permission

Input:
  - sceneId: UUID
  - content: Scene text
  - context: Optional narrative context
  - options: Optional evaluation parameters

Process:
  1. Authenticate user (session or API key)
  2. Verify user owns the story
  3. Build evaluation prompt
  4. Call OpenAI GPT-4o-mini via Vercel AI Gateway
  5. Parse evaluation using Zod schema
  6. Calculate category scores (weighted average)
  7. Store in sceneEvaluations table
  8. Return evaluation with metadata

Output:
  - evaluationId: UUID
  - sceneId: UUID
  - evaluation: Full evaluation object with scores
  - metadata: Model version, token usage, time taken
```

### 5.2 Evaluation Categories & Scoring

```typescript
// Lines 93-122
Category Scores (0-100):
- plot (25% weight):
  * hookEffectiveness
  * goalClarity
  * conflictEngagement
  * cliffhangerTransition

- character (25% weight):
  * agency
  * voiceDistinction
  * emotionalDepth
  * relationshipDynamics

- pacing (16.67% weight):
  * microPacing
  * tensionManagement
  * sceneEconomy

- prose (16.67% weight):
  * clarity
  * showDontTell
  * voiceConsistency
  * technicalQuality

- worldBuilding (16.66% weight):
  * integration
  * consistency
  * mysteryGeneration

Overall Score = Weighted average (0-100)
```

### 5.3 Scene Evaluations Table

**File**: `src/lib/db/schema.ts` (lines 428-456)

```typescript
sceneEvaluations table:
  - id: text (primary key, UUID)
  - sceneId: text (foreign key → scenes.id)
  - evaluation: json (full evaluation object)
  - overallScore: varchar (numeric string)
  - plotScore: varchar
  - characterScore: varchar
  - pacingScore: varchar
  - proseScore: varchar
  - worldBuildingScore: varchar
  - modelVersion: varchar (default: 'gpt-4o-mini')
  - tokenUsage: integer (optional)
  - evaluationTimeMs: integer (optional)
  - evaluatedAt: timestamp (auto-generated)
```

**Relationship**:
```typescript
export const sceneEvaluationsRelations = relations(
  sceneEvaluations, 
  ({ one }) => ({
    scene: one(scenes, {
      fields: [sceneEvaluations.sceneId],
      references: [scenes.id],
    }),
  })
);
```

---

## 6. What's Missing: Scene-by-Scene Publishing

### 6.1 Schema Gaps

**Scenes table needs**:
```typescript
// Missing fields:
- publishedAt: timestamp (when scene was published)
- scheduledFor: timestamp (scheduled publish time)
- isPublished: boolean (quick lookup)
- publishOrder: integer (sequence of publication)
- visibility: varchar ('draft' | 'scheduled' | 'published' | 'archived')
```

### 6.2 Missing API Endpoints

**Required endpoints**:
```
POST /api/scenes/[id]/publish - Publish individual scene
POST /api/scenes/[id]/unpublish - Unpublish scene
PATCH /api/scenes/[id]/schedule - Set publish schedule
GET /api/stories/[id]/publish-timeline - Get publication timeline
GET /api/chapters/[id]/scenes/publish-status - Get chapter scene statuses
```

### 6.3 Missing Features

1. **Scene-by-scene publication control**
   - Ability to publish individual scenes within a chapter
   - Non-linear publication (publish scene 3 before scene 2)
   - Scene visibility management

2. **Publish scheduling**
   - Calendar UI for scheduling individual scenes
   - Scheduled publish queue
   - Automatic publishing when schedule time arrives
   - Rescheduling capability

3. **Publication timeline visualization**
   - Timeline view of past/future publications
   - Gantt-style chart for multiple chapters
   - Publication calendar
   - Engagement prediction based on schedule

4. **Draft/Preview states**
   - Scene as "preview only" before full publication
   - Reader feedback on drafts
   - Draft sharing with specific users

5. **Rollback capability**
   - Unpublish individual scenes
   - Restore previous versions
   - Publication history per scene

---

## 7. Testing & Scripts

### 7.1 Publish Script

**File**: `scripts/publish-story.ts`

```typescript
// Manual script to publish entire story + all chapters
// Usage: dotenv --file .env.local run npx tsx scripts/publish-story.ts

Process:
1. Gets story by hardcoded ID
2. Updates story.status = 'published'
3. Updates all chapter.status = 'published'
4. Verifies updates
5. Reports final status
```

### 7.2 Auto-Publish Test Script

**File**: `scripts/test-auto-publish-with-setup.ts`

```typescript
// Tests automatic chapter publishing on scene completion
// Creates test story → part → chapter → 3 scenes
// Simulates writing content to each scene
// When all scenes have content, chapter auto-publishes
// Verifies the automatic transition

Test flow:
1. Create test story, part, chapter
2. Create 3 empty scenes
3. Update Scene 1 with content
4. Check if chapter published (should be NO)
5. Update Scene 2 with content
6. Check if chapter published (should be NO)
7. Update Scene 3 with content
8. Check if chapter published (should be YES - all scenes have content)
9. Clean up test data
```

---

## 8. Current Data Flow

```
┌─────────────────────┐
│   PublishClient     │ (src/components/publish/PublishClient.tsx)
│   (UI Component)    │
└──────────┬──────────┘
           │
           ├─→ usePublishStatus() ──→ GET /api/publish/status
           ├─→ usePublishHistory() ──→ GET /api/publish/history
           └─→ usePublishAnalytics() ──→ GET /api/publish/analytics
                                              │
                                              ↓
                            Database Queries (Drizzle ORM)
                            ├─→ stories table
                            ├─→ chapters table (status, publishedAt)
                            └─→ scenes table (no publish fields)
```

---

## 9. Type System & Validation

### 9.1 Chapter Update Schema

**File**: `src/app/api/chapters/[id]/route.ts` (lines 8-15)

```typescript
const updateChapterSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'published']).optional(),
  wordCount: z.number().min(0).optional(),
  publishedAt: z.string().datetime().optional(),
  scheduledFor: z.string().datetime().optional(),
});
```

**Note**: Accepts `scheduledFor` but doesn't use it - just stores in DB.

### 9.2 Scene Evaluation Schema

**File**: `src/lib/evaluation/schemas.ts` (imported but not shown)

- Uses Zod for request/response validation
- evaluationRequestSchema
- evaluationResultSchema
- Type-safe evaluation objects

---

## 10. Authentication & Authorization

### 10.1 Chapter Publishing Auth

**File**: `src/app/api/chapters/[id]/publish/route.ts` (lines 13-16)

```typescript
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

- Session-based only
- No API key support
- No scope checking

### 10.2 Scene Evaluation Auth

**File**: `src/app/api/evaluate/scene/route.ts` (lines 21-36)

```typescript
const authResult = await authenticateRequest(request);
if (!authResult) {
  return NextResponse.json(
    { error: 'Authentication required' },
    { status: 401 }
  );
}

if (!hasRequiredScope(authResult, 'stories:read')) {
  return NextResponse.json(
    { error: 'Insufficient permissions...' },
    { status: 403 }
  );
}
```

- Supports both session and API key
- Scope-based authorization (stories:read)
- More robust auth pattern

---

## 11. Scheduled Publishing Implementation Notes

### 11.1 What Would Be Needed

1. **Background Job Queue**
   - Check for scheduled publishes regularly
   - Trigger publication when scheduledFor time arrives
   - Handle failed publishes with retry logic

   Example:
   ```typescript
   // Missing: Job queue service
   // Could use: node-cron, bull, RabbitMQ, etc.
   
   async function publishScheduledChapters() {
     const now = new Date();
     const scheduledChapters = await db
       .select()
       .from(chapters)
       .where(
         and(
           eq(chapters.status, 'writing'),
           and(
             isNotNull(chapters.scheduledFor),
             lte(chapters.scheduledFor, now)
           )
         )
       );
     
     for (const chapter of scheduledChapters) {
       await publishChapter(chapter.id);
     }
   }
   ```

2. **Webhook System**
   - Notify subscribers when content publishes
   - Send emails to followers
   - Update activity feed

3. **Timeline Visualization**
   - React component for timeline
   - Calendar integration
   - Drag-to-reschedule functionality

4. **Preview/Draft System**
   - Separate visibility for readers
   - Subscriber-only previews
   - Timed visibility changes

---

## 12. Architecture Recommendations

### Phase 1: Foundation (Scene Publishing)
```
1. Add publishing fields to scenes table
   - publishedAt, scheduledFor, isPublished
   - publishOrder, visibility

2. Create scene publishing APIs
   - POST /api/scenes/[id]/publish
   - POST /api/scenes/[id]/unpublish
   - PATCH /api/scenes/[id]/schedule

3. Extend chapter publishing to respect scene status
   - Only allow publishing chapters with all scenes published
   - Or allow partial chapters (first N scenes)
```

### Phase 2: Scheduling
```
1. Add scheduling service
   - Background job queue
   - Scheduled publishing logic
   - Retry mechanism

2. Update publish APIs
   - Accept scheduling parameters
   - Validate scheduled times
   - Handle timezone conversions

3. Create schedule management UI
   - Calendar view
   - Drag-to-reschedule
   - Bulk scheduling
```

### Phase 3: Visualization
```
1. Timeline component
   - Horizontal timeline
   - Interactive points for publications
   - Status indicators

2. Calendar view
   - Month/week/day views
   - Drag-to-schedule
   - Conflict detection

3. Analytics dashboard
   - Publication frequency
   - Engagement by publish time
   - Recommendation engine
```

---

## 13. File Summary

| Path | Type | Lines | Purpose |
|------|------|-------|---------|
| `src/app/publish/page.tsx` | Page | 23 | Main publish hub |
| `src/components/publish/PublishClient.tsx` | Component | 460 | Publish UI with status/history/analytics |
| `src/components/dashboard/PublishingSchedule.tsx` | Component | 97 | Dashboard publish widget |
| `src/app/api/chapters/[id]/publish/route.ts` | API | 83 | Chapter publish endpoint |
| `src/app/api/chapters/[id]/unpublish/route.ts` | API | 40 | Chapter unpublish endpoint |
| `src/app/api/publish/status/route.ts` | API | 69 | Publish status endpoint (mock data) |
| `src/app/api/publish/history/route.ts` | API | 59 | Publish history endpoint |
| `src/app/api/publish/analytics/route.ts` | API | 95 | Publish analytics endpoint (mock data) |
| `src/app/api/evaluate/scene/route.ts` | API | 214 | Scene evaluation endpoint (REAL AI) |
| `src/lib/hooks/use-page-cache.ts` | Hook | 372 | SWR data fetching with caching |
| `src/lib/db/schema.ts` | Schema | 457 | Database schema (partial publishing support) |
| `src/lib/db/queries.ts` | Queries | 800+ | Database operations |
| `scripts/publish-story.ts` | Script | 83 | Manual full story publish |
| `scripts/test-auto-publish-with-setup.ts` | Script | 178 | Auto-publish on completion test |

---

## 14. Key Insights

### What's Working
✅ Chapter-level publishing
✅ Publishing history tracking
✅ Scene evaluation API with AI
✅ Published chapter filtering
✅ Basic publish status tracking

### What's Not Working
❌ Scene-by-scene publishing (no schema support)
❌ Scheduled publishing (fields exist but no automation)
❌ Timeline visualization
❌ Publication calendar
❌ Automatic publish on schedule
❌ Scene visibility management
❌ Preview/draft states for scenes
❌ Real engagement metrics (all mock data)

### Critical Gaps
1. **No background job system** for scheduled publishes
2. **Scenes lack publishing metadata** (publishedAt, scheduledFor, visibility)
3. **Analytics are completely mocked** - no real data tracking
4. **UI doesn't bind to actual scheduling logic** - buttons don't save schedules
5. **No notification system** for scheduled publishes
6. **No timeline visualization components**

---

## 15. Next Steps to Implement Scene-by-Scene Publishing

1. **Database Migration**
   - Add scenes.publishedAt, scenes.scheduledFor, scenes.visibility
   - Create publications_history table for audit trail

2. **API Development**
   - Create scene publish/unpublish/schedule endpoints
   - Add publication timeline API
   - Implement schedule validation

3. **Background Services**
   - Set up job queue (Bull, RabbitMQ, or cron)
   - Implement scheduled publish worker
   - Add notification triggers

4. **UI Components**
   - Timeline visualization
   - Calendar/schedule picker
   - Scene publish controls in editor
   - Publication history detail view

5. **Testing**
   - Unit tests for scheduling logic
   - Integration tests for auto-publish
   - E2E tests for full publish flow


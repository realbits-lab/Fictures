# Publishing Features - Quick Reference Guide

## Current State vs. Planned Features

### IMPLEMENTED FEATURES ✅

#### 1. Chapter Publishing
```
POST /api/chapters/[id]/publish
- Publishes entire chapter
- Requires: chapter has scenes with content
- Sets: status='published', publishedAt=now()
- Returns: updated chapter
```

#### 2. Chapter Unpublishing
```
POST /api/chapters/[id]/unpublish
- Reverts chapter to 'writing' state
- Removes publishedAt timestamp
- Data preserved, not deleted
```

#### 3. Publishing Status
```
GET /api/publish/status
- Shows scheduled items (upcoming 4 chapters)
- Shows ready-to-publish chapter
- Shows pending count
- Note: Mock data, not actual schedule
```

#### 4. Publishing History
```
GET /api/publish/history
- Lists all published chapters chronologically
- Engagement stats (mock data)
- Monthly publishing count
```

#### 5. Publishing Analytics
```
GET /api/publish/analytics
- Latest chapter performance
- Views, comments, reactions, rating (MOCK)
- Pre-publish buzz metrics (MOCK)
- Optimal publish time (MOCK)
```

#### 6. Scene Evaluation (AI-Powered)
```
POST /api/evaluate/scene
- Evaluates scene quality using GPT-4o-mini
- Scores: Plot, Character, Pacing, Prose, WorldBuilding
- Stores evaluations in database
- Returns: scores, metrics, feedback
- Auth: Session + API key support
- Scope: 'stories:read' required
```

#### 7. UI Components
```
- PublishClient (460 lines)
  * Publishing Schedule card
  * Quick Publish card
  * Analytics section
  
- PublishingSchedule (97 lines)
  * Dashboard widget
  
- Publication Center Page
  * /publish route
```

#### 8. Data Hooks
```
usePublishStatus()     - GET /api/publish/status
usePublishHistory()    - GET /api/publish/history
usePublishAnalytics()  - GET /api/publish/analytics
- SWR with localStorage persistence
- Configurable refresh intervals
- Error handling & retries
```

---

### MISSING FEATURES ❌

#### 1. Scene-by-Scene Publishing
```
MISSING:
- POST /api/scenes/[id]/publish
- POST /api/scenes/[id]/unpublish
- PATCH /api/scenes/[id]/schedule
- No scenes.publishedAt field
- No scenes.scheduledFor field
- No scenes.visibility field
- No scenes.isPublished flag

BLOCKED BY:
- Schema migration
- API endpoints
- Publishing logic
- UI controls
```

#### 2. Scheduled Publishing
```
MISSING:
- Background job queue
- Automatic publish worker
- Schedule validation
- Timezone handling
- Webhook notifications
- Rescheduling UI

PARTIALLY DONE:
- chapters.scheduledFor field (in schema)
- UI shows "Schedule" radio button
- BUT: Not bound to actual scheduling logic
```

#### 3. Publication Timeline
```
MISSING:
- Timeline visualization component
- Calendar view
- Gantt chart for multiple chapters
- Drag-to-reschedule UI
- Publication frequency chart
- Engagement predictor
```

#### 4. Real Analytics
```
CURRENT: All mock data (random numbers)
- 3,247 views (random)
- 126 comments (random)
- 456 reactions (random)
- 4.9/5 rating (random)
- 87% engagement (random)
- Trending rank (random)
- Pre-publish buzz (random)
- Optimal time (random)

TODO: Connect to actual:
- View counts
- Comment counts
- Engagement metrics
- Reader activity logs
```

---

## Database Schema: Publishing Fields

### CHAPTERS TABLE
```typescript
status: statusEnum('writing' | 'published')     ✅ Used
publishedAt: timestamp                           ✅ Used
scheduledFor: timestamp                          ❌ Not used (automation missing)
```

### SCENES TABLE
```typescript
status: varchar (for progress, not publishing)  ✅ Used for progress
publishedAt: timestamp                          ❌ MISSING
scheduledFor: timestamp                         ❌ MISSING
isPublished: boolean                            ❌ MISSING
publishOrder: integer                           ❌ MISSING
visibility: varchar                             ❌ MISSING
```

### NEW TABLE NEEDED
```typescript
sceneEvaluations table                          ✅ EXISTS (428-456)
- Full evaluation data (AI results)
- Scores for 5 categories
- Model version & token usage
- Timestamp
```

---

## API Endpoints: Current vs. Planned

### PUBLISH API GROUP

**Current Endpoints:**
```
GET  /api/publish/status       - Scheduling overview (mock)
GET  /api/publish/history      - Publication history (real data)
GET  /api/publish/analytics    - Performance metrics (mock data)
```

**Missing Endpoints:**
```
POST /api/scenes/[id]/publish           - Publish single scene
POST /api/scenes/[id]/unpublish         - Unpublish scene
PATCH /api/scenes/[id]/schedule         - Set schedule
GET  /api/stories/[id]/publish-timeline - Timeline view
GET  /api/chapters/[id]/scenes/status   - Scene status
```

---

## File Tree: Publishing-Related

```
src/
├── app/
│   ├── publish/
│   │   └── page.tsx ............................ Main page
│   └── api/
│       ├── chapters/[id]/
│       │   ├── publish/route.ts ............... Publish chapter ✅
│       │   ├── unpublish/route.ts ............ Unpublish ✅
│       │   └── route.ts ....................... Update chapter
│       ├── publish/
│       │   ├── status/route.ts ............... Mock data
│       │   ├── history/route.ts ............. Real data
│       │   └── analytics/route.ts ........... Mock data
│       └── evaluate/
│           └── scene/route.ts ............... AI evaluation ✅
├── components/
│   ├── publish/
│   │   └── PublishClient.tsx ................. Main UI (460 lines)
│   └── dashboard/
│       └── PublishingSchedule.tsx ........... Widget (97 lines)
├── lib/
│   ├── db/
│   │   ├── schema.ts ........................ Publishing fields
│   │   └── queries.ts ....................... DB operations
│   └── hooks/
│       └── use-page-cache.ts ............... Data hooks
└── scripts/
    ├── publish-story.ts .................... Manual publish ✅
    └── test-auto-publish-with-setup.ts .... Auto-publish test ✅
```

---

## Data Flow Diagram

```
User Interface
    │
    ├─→ PublishClient Component
    │   ├─→ usePublishStatus()      GET /api/publish/status
    │   ├─→ usePublishHistory()     GET /api/publish/history
    │   └─→ usePublishAnalytics()   GET /api/publish/analytics
    │
    └─→ [Buttons: Publish, Schedule, Edit]
        │
        ├─→ POST /api/chapters/[id]/publish
        │   └─→ DB: Update chapter (status, publishedAt)
        │
        └─→ POST /api/chapters/[id]/unpublish
            └─→ DB: Revert chapter (status='writing')
```

---

## Database Relationships

```
story (1) ──────────── (many) chapter
                           │
                           ├─ status: 'writing' | 'published'
                           ├─ publishedAt: timestamp
                           ├─ scheduledFor: timestamp [NOT USED]
                           │
                           └──── (many) scene
                                  ├─ status: varchar [content progress only]
                                  ├─ content: text
                                  └─ [NO PUBLISHING FIELDS]

sceneEvaluation (many) ──────── (1) scene
    ├─ evaluation: json [full AI results]
    ├─ scores: varchar × 5 [plot, char, pacing, prose, world]
    ├─ modelVersion: varchar
    └─ evaluatedAt: timestamp
```

---

## Critical Missing Pieces

### 1. No Background Job System
```typescript
// Needed: Scheduled publish worker
async function publishScheduledContent() {
  const now = new Date();
  const scheduled = await db.select()
    .from(chapters)
    .where(and(
      eq(chapters.status, 'writing'),
      isNotNull(chapters.scheduledFor),
      lte(chapters.scheduledFor, now)
    ));
  
  for (const chapter of scheduled) {
    await publishChapter(chapter.id);
  }
}
```

### 2. No Timeline Visualization
```typescript
// Needed: React component
interface TimelineProps {
  items: PublicationItem[];
  view: 'timeline' | 'calendar' | 'gantt';
  onScheduleChange: (id: string, date: Date) => void;
}

export function PublicationTimeline(props: TimelineProps) {
  // Timeline rendering
}
```

### 3. No Real Analytics Tracking
```typescript
// Needed: Track actual user engagement
interface ChapterAnalytics {
  views: number;          // Real counts
  comments: number;       // Real counts
  reactions: number;      // Real counts
  rating: number;         // Real average
  engagementRate: number; // Real percentage
}
```

### 4. No Scene Publishing Logic
```typescript
// Needed: Scene-level publish endpoints
export async function publishScene(sceneId: string, userId: string) {
  // Validate user owns scene
  // Check scene has content
  // Set publishedAt, visibility='published'
  // Return updated scene
}
```

---

## Authentication & Authorization

### Chapter Publishing
```typescript
- Auth: Session only
- Scope: None checked
- Validation: User owns story (checked)
```

### Scene Evaluation
```typescript
- Auth: Session + API Key
- Scope: 'stories:read' required
- Validation: User owns story (checked)
```

**Gap**: Chapter publishing doesn't support API keys yet.

---

## Testing Infrastructure

### Existing Tests
```
scripts/publish-story.ts
- Manual full story publish
- Hardcoded story ID
- Updates story + all chapters

scripts/test-auto-publish-with-setup.ts
- Creates test story/chapter/3 scenes
- Simulates writing scenes
- Verifies auto-publish on completion
```

### Missing Tests
```
- Unit tests for publish APIs
- Integration tests for scheduling
- E2E tests for full flow
- Timeline visualization tests
- Scene evaluation persistence tests
```

---

## Implementation Checklist for Scene Publishing

### Phase 1: Database (1 day)
- [ ] Add fields to scenes table
  - [ ] publishedAt: timestamp
  - [ ] scheduledFor: timestamp
  - [ ] visibility: varchar
  - [ ] isPublished: boolean
- [ ] Create migration
- [ ] Update schema types
- [ ] Update queries

### Phase 2: APIs (2 days)
- [ ] POST /api/scenes/[id]/publish
- [ ] POST /api/scenes/[id]/unpublish
- [ ] PATCH /api/scenes/[id]/schedule
- [ ] GET /api/chapters/[id]/scenes/status
- [ ] Add Zod schemas for validation
- [ ] Add authorization checks

### Phase 3: Background Jobs (2 days)
- [ ] Add job queue library (Bull, etc.)
- [ ] Implement scheduled publish worker
- [ ] Add retry logic
- [ ] Add webhook notifications
- [ ] Add error tracking

### Phase 4: UI Components (2 days)
- [ ] Scene publish buttons in editor
- [ ] Schedule picker component
- [ ] Timeline visualization
- [ ] Calendar view
- [ ] Scene status indicator

### Phase 5: Integration (1 day)
- [ ] Update chapter publishing logic
- [ ] Update history/status/analytics
- [ ] Test with real data
- [ ] Performance optimization

---

## Performance Considerations

### Current
- usePublishStatus: revalidateOnFocus=true (1 min min)
- usePublishHistory: 5 min refresh interval
- usePublishAnalytics: 2 min refresh interval
- No pagination on history

### For Scene Publishing
- [ ] Pagination for timeline
- [ ] Lazy loading for historical data
- [ ] Cache schedule queries
- [ ] Debounce schedule updates
- [ ] Index on publishedAt, scheduledFor

---

## Security Checklist

### Current
- ✅ Authentication required (session)
- ✅ User ownership check
- ✅ No SQL injection (Drizzle ORM)
- ❌ No API key support
- ❌ No rate limiting

### For Scene Publishing
- [ ] Rate limit publish endpoints
- [ ] Audit trail for publishing
- [ ] Rollback permissions
- [ ] Schedule permissions (editor vs. viewer)
- [ ] API key support
- [ ] Scope-based authorization

---

## Mock Data Locations

```typescript
/api/publish/status/route.ts
  Lines 31-41: scheduledItems mock
  Line 44: readyToPublish first chapter
  Line 58: pending count (real)

/api/publish/history/route.ts
  Lines 32-37: engagement stats (RANDOM)
  Lines 42-49: thisMonth filter (real)

/api/publish/analytics/route.ts
  Lines 36-42: views, comments, reactions, rating (RANDOM)
  Lines 40: engagementRate (RANDOM 70-100%)
  Lines 55-58: prepublishBuzz (RANDOM)
  Lines 60-62: optimalTime (RANDOM)
```

---

## Next Steps (Priority Order)

1. **Fix Analytics** (1 day)
   - Replace mock data with real counts
   - Track actual views/comments/reactions
   - Calculate real engagement rates

2. **Add Scene Publishing** (4 days)
   - Schema + migrations
   - Scene publish/unpublish APIs
   - Scene status queries

3. **Implement Scheduling** (3 days)
   - Background job queue
   - Schedule validation
   - Auto-publish worker

4. **Build Timeline UI** (3 days)
   - React components
   - Calendar integration
   - Interactive scheduling

5. **Complete Testing** (2 days)
   - Unit tests
   - Integration tests
   - E2E tests

---

## Helpful Links

- Database: `src/lib/db/schema.ts` (lines 125-176)
- APIs: `src/app/api/chapters/[id]/publish/` and `/publish/`
- UI: `src/components/publish/PublishClient.tsx`
- Hooks: `src/lib/hooks/use-page-cache.ts` (lines 168-209)
- Scene Evaluation: `src/app/api/evaluate/scene/route.ts`

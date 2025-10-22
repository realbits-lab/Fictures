# Publishing Features - Complete File Index

## Quick Navigation

Use these absolute paths to navigate to publishing-related files:

---

## Frontend: Pages & Components

### Main Pages
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/publish/page.tsx`
  - Entry point for Publication Center
  - Route: `/publish`
  - Minimal page wrapper

### Components
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/components/publish/PublishClient.tsx` (460 lines)
  - Main UI component for publication center
  - Contains: Publishing Schedule, Quick Publish, Analytics sections
  - Uses: usePublishStatus, usePublishHistory, usePublishAnalytics hooks
  - Features: Loading states, error handling, fallback data

- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/components/dashboard/PublishingSchedule.tsx` (97 lines)
  - Compact dashboard widget
  - Shows upcoming published items
  - Uses: usePublishStatus hook

---

## Backend: API Routes

### Chapter Publishing
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/api/chapters/[id]/publish/route.ts` (83 lines)
  - POST endpoint to publish chapter
  - Validates: Chapter has scenes, scenes have content
  - Sets: status='published', publishedAt=current timestamp
  - Key logic: Lines 21-39 (validation)

- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/api/chapters/[id]/unpublish/route.ts` (40 lines)
  - POST endpoint to unpublish chapter
  - Reverts to 'writing' state
  - Removes publishedAt timestamp

### Chapter Management
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/api/chapters/[id]/route.ts`
  - GET: Fetch chapter details
  - PATCH: Update chapter (title, content, status, dates)
  - Accepts scheduledFor parameter (not used)

### Publish Status & Analytics
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/api/publish/status/route.ts` (69 lines)
  - GET endpoint for publish status
  - Returns: scheduledItems (mock), readyToPublish, pending count
  - Mock data generated from user chapters (lines 31-41)
  - Status values: 'ready', 'draft', 'planned', 'idea'

- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/api/publish/history/route.ts` (59 lines)
  - GET endpoint for publishing history
  - Filters: chapters where publishedAt is NOT NULL
  - Returns: publications array, totalPublished count, thisMonth count
  - Mock engagement data (lines 32-37): RANDOM numbers

- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/api/publish/analytics/route.ts` (95 lines)
  - GET endpoint for publish analytics
  - Latest chapter performance metrics (ALL MOCK)
  - Mock data includes:
    * Views (random 1000-5000)
    * Comments (random 50-250)
    * Reactions (random 100-600)
    * Rating (random 4.0-5.0)
    * Engagement rate (random 80-100%)
    * Trending rank (random 1-10)
    * Pre-publish buzz (random)
    * Optimal publish time (random day/time)
  - Helper functions (lines 75-94): getTimeAgo(), getOptimalPublishTime()

### Scene Evaluation (AI-Powered)
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/api/evaluation/route.ts` (187 lines)
  - POST: Evaluate story content (full or quick)
  - GET: Fetch evaluation history (placeholder)
  - Supports: Full story evaluation, quick component evaluation
  - Calls: evaluateStoryContent(), quickEvaluate()

- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/api/evaluate/scene/route.ts` (214 lines)
  - **REAL AI Integration** (not mock)
  - POST endpoint to evaluate single scene
  - Auth: Supports session + API key (lines 21-36)
  - Scope: Requires 'stories:read'
  - Process (lines 19-147):
    1. Authenticate user
    2. Verify scene ownership
    3. Build evaluation prompt
    4. Call GPT-4o-mini via Vercel AI Gateway
    5. Calculate weighted category scores (lines 93-125)
    6. Store in sceneEvaluations table (lines 128-146)
  - Scoring categories (lines 93-122):
    * Plot (25%): hook, goal, conflict, cliffhanger
    * Character (25%): agency, voice, depth, dynamics
    * Pacing (16.67%): micro pacing, tension, economy
    * Prose (16.67%): clarity, show/tell, voice, quality
    * WorldBuilding (16.66%): integration, consistency, mystery
  - Helper functions (lines 185-213): calculateCategoryScore(), calculateWeightedScore()

---

## Database: Schema & Queries

### Database Schema
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/db/schema.ts`
  - **Chapters table** (lines 125-150):
    * status: statusEnum('writing' | 'published')
    * publishedAt: timestamp
    * scheduledFor: timestamp
  - **Scenes table** (lines 152-176):
    * status: varchar (for progress tracking only)
    * NO publishedAt field
    * NO scheduledFor field
    * NO visibility field
  - **Scene Evaluations table** (lines 428-456):
    * id, sceneId, evaluation (json), scores (5 categories)
    * modelVersion, tokenUsage, evaluationTimeMs
    * evaluatedAt timestamp
  - **Relationships** (lines 428-456):
    * sceneEvaluations → scenes (one-to-many)

### Database Queries
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/db/queries.ts`
  - createChapter() (lines 203-230)
  - updateChapter() (lines 269-296)
  - getChapterById() (lines 251-267)
  - getStoryChapters() (lines 298-308)
  - updateUserStats() (lines 311-321)
  - calculateSceneStatus() (lines 324-354)
  - calculateChapterStatus() (lines 356-372)
  - calculatePartStatus() (lines 374-390)
  - calculateStoryStatus() (lines 392+)

### Database Relations
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/db/relationships.ts`
  - Drizzle ORM relationship definitions
  - Bi-directional relationship management

---

## Data Fetching & Caching

### SWR Hooks
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/hooks/use-page-cache.ts`
  - usePublishStatus() (lines 168-181)
    * URL: /api/publish/status
    * Refresh: revalidateOnFocus=true
    * Cache: CACHE_CONFIGS.publish
  - usePublishHistory() (lines 183-196)
    * URL: /api/publish/history
    * Refresh: 5 minutes (revalidateOnFocus=false)
    * Cache: CACHE_CONFIGS.publish
  - usePublishAnalytics() (lines 198-209)
    * URL: /api/publish/analytics
    * Refresh: 2 minutes (revalidateOnFocus=false)
    * Cache: CACHE_CONFIGS.analytics

### Base SWR Implementation
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/hooks/use-persisted-swr.ts`
  - Provides: usePersistedSWR() hook with localStorage persistence

---

## Testing & Scripts

### Manual Publishing
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/scripts/publish-story.ts` (83 lines)
  - Manually publish entire story + all chapters
  - Hardcoded story ID: 'Q185oK6qjmlmhDKNGpjGS'
  - Sets story.status = 'published'
  - Sets all chapter.status = 'published'
  - Verifies final status

### Auto-Publish Testing
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/scripts/test-auto-publish-with-setup.ts` (178 lines)
  - Creates test story → part → chapter → 3 scenes
  - Simulates writing content to each scene
  - Verifies automatic chapter publishing on completion
  - Key logic (lines 100-142): Simulate scene content updates
  - Cleanup (lines 161-167): Remove test data

---

## Supporting Files

### Authentication
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/auth/index.ts`
  - Auth context and utilities
  - Used by: Chapter publish endpoints

- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/auth/dual-auth.ts`
  - Supports session + API key authentication
  - Used by: Scene evaluation endpoint
  - Functions: authenticateRequest(), hasRequiredScope()

### UI Components (Base)
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/components/ui/index.ts`
  - Card, CardHeader, CardTitle, CardContent
  - Button, Badge, Progress, Skeleton
  - Used by: PublishClient component

### Layout
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/components/layout/index.ts`
  - MainLayout wrapper
  - Used by: /publish page

---

## Environment & Configuration

### Environment Variables (Required)
- `.env.local`
  - AUTH_SECRET: NextAuth secret
  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: OAuth
  - AI_GATEWAY_API_KEY: Vercel AI Gateway for OpenAI
  - POSTGRES_URL: Database connection
  - REDIS_URL: Session storage

### Package Dependencies
- `pnpm`: Package manager
- `next`: Framework
- `drizzle-orm`: Database ORM
- `ai` & `@ai-sdk/gateway`: AI integration
- `zod`: Schema validation
- `swr`: Data fetching
- `next-auth`: Authentication

---

## Documentation Files

### Analysis Documents (Created)
- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/PUBLISH_FEATURES_ANALYSIS.md`
  - Comprehensive 15-section analysis
  - ~500 lines
  - Includes: Architecture, APIs, UI, gaps, recommendations

- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/PUBLISH_QUICK_REFERENCE.md`
  - Quick reference guide
  - Checklists and diagrams
  - Implementation priorities

- `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/PUBLISH_FILES_INDEX.md`
  - This file
  - Complete file index with line numbers

---

## Key Statistics

| Metric | Count |
|--------|-------|
| Publishing API endpoints | 8 |
| Publishing UI components | 3 |
| Database tables (publish-related) | 3 |
| Data fetch hooks | 3 |
| Test scripts | 2 |
| Lines of code (APIs) | ~500 |
| Lines of code (UI) | ~600 |
| Scene Evaluation integration | ACTIVE |
| Scene publishing support | MISSING |
| Scheduled publishing automation | MISSING |
| Timeline visualization | MISSING |

---

## File Size Summary

```
src/app/api/chapters/[id]/publish/route.ts      83 lines
src/app/api/chapters/[id]/unpublish/route.ts    40 lines
src/app/api/chapters/[id]/route.ts             ~100 lines
src/app/api/publish/status/route.ts             69 lines
src/app/api/publish/history/route.ts            59 lines
src/app/api/publish/analytics/route.ts          95 lines
src/app/api/evaluation/route.ts                187 lines
src/app/api/evaluate/scene/route.ts            214 lines
---
Total API routes                               ~847 lines

src/components/publish/PublishClient.tsx       460 lines
src/components/dashboard/PublishingSchedule.tsx 97 lines
src/app/publish/page.tsx                        23 lines
---
Total UI                                       ~580 lines

src/lib/hooks/use-page-cache.ts (partial)      ~42 lines
---

TOTAL PUBLISH RELATED CODE: ~1,500+ lines
```

---

## Search Tips

### Find all publish-related files
```bash
find /Users/thomasjeon/GitHub/@dev.realbits/Fictures -path "*publish*" -type f
find /Users/thomasjeon/GitHub/@dev.realbits/Fictures -path "*eval*" -type f
```

### Find all references to scheduling
```bash
grep -r "scheduledFor\|published" \
  /Users/thomasjeon/GitHub/@dev.realbits/Fictures/src \
  --include="*.ts" --include="*.tsx"
```

### Find mock data locations
```bash
grep -r "Math.random\|mock" \
  /Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/api/publish \
  --include="*.ts"
```

---

## Related Documentation

- **CLAUDE.md**: Project configuration and development guidelines
- **PUBLISH_FEATURES_ANALYSIS.md**: Detailed analysis (read first)
- **PUBLISH_QUICK_REFERENCE.md**: Quick reference (read second)
- **PUBLISH_FILES_INDEX.md**: This file (use for navigation)

---

## Implementation Guide

### To understand the current publish system:
1. Read: PUBLISH_QUICK_REFERENCE.md (5 min)
2. Read: PUBLISH_FEATURES_ANALYSIS.md sections 1-5 (10 min)
3. View: src/components/publish/PublishClient.tsx (understand UI)
4. View: src/app/api/chapters/[id]/publish/route.ts (understand API)
5. View: src/lib/hooks/use-page-cache.ts lines 168-209 (understand data fetching)

### To implement scene publishing:
1. Start: PUBLISH_FEATURES_ANALYSIS.md section 6 (gaps)
2. Start: PUBLISH_QUICK_REFERENCE.md section "Missing Features"
3. Phase 1 (DB): Add fields to scenes table
4. Phase 2 (APIs): Create scene publish endpoints
5. Phase 3+ (Background/UI): Follow architecture recommendations

---

## Quick Links (Absolute Paths)

```
Database Schema:
/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/db/schema.ts

Chapter Publish API:
/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/api/chapters/[id]/publish/route.ts

Publish Status API:
/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/api/publish/status/route.ts

PublishClient Component:
/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/components/publish/PublishClient.tsx

Data Hooks:
/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/hooks/use-page-cache.ts

Scene Evaluation API:
/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/api/evaluate/scene/route.ts

Test Scripts:
/Users/thomasjeon/GitHub/@dev.realbits/Fictures/scripts/publish-story.ts
/Users/thomasjeon/GitHub/@dev.realbits/Fictures/scripts/test-auto-publish-with-setup.ts
```


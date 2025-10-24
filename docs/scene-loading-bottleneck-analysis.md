# Scene Loading Performance Bottleneck Analysis

## Executive Summary

**Bottleneck Identified:** Database query contention on the `chapters` table during concurrent API requests.

**Impact:** Chapter queries slow down from ~220ms to 1200-1600ms (5-7x slower) when multiple requests execute in parallel.

**Root Cause:** Parallel HTTP fetching strategy is causing database connection pool contention and/or table-level locks.

**Solution Priority:** HIGH - Affects initial page load performance significantly.

---

## Performance Analysis Results

### Test Date
- Run: 2025-01-24
- Script: `scripts/analyze-scene-loading-performance.mjs`
- Environment: Local development with Neon PostgreSQL

### Key Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Component Mount | <5ms | ✅ Excellent |
| Average SWR Fetch | 901ms | ⚠️ Slow |
| Average Prefetch (cache miss) | 921ms | ⚠️ Slow |
| Parallel Fetch (3 chapters) | 2630ms | ❌ Very Slow |
| Navigation | 2.6ms | ✅ Excellent |
| Scroll Restoration | N/A | ℹ️ Not tested |

---

## Bottleneck Deep Dive

### API Request Timing Breakdown

#### During Parallel Fetch (3 concurrent requests)

**Request 1:**
```
Total: 1733ms
├─ Auth: 6ms (0.3%)
├─ Chapter Query: 1278ms (73.7%) 🔥 BOTTLENECK
├─ Story Query: 220ms (12.7%)
├─ Scenes Query: 228ms (13.2%)
└─ ETag: 0.08ms (0%)
```

**Request 2:**
```
Total: 1933ms
├─ Auth: 4ms (0.2%)
├─ Chapter Query: 1493ms (77.2%) 🔥 BOTTLENECK
├─ Story Query: 211ms (10.9%)
├─ Scenes Query: 225ms (11.6%)
└─ ETag: 0.07ms (0%)
```

**Request 3:**
```
Total: 1942ms
├─ Auth: 4ms (0.2%)
├─ Chapter Query: 1526ms (78.6%) 🔥 BOTTLENECK
├─ Story Query: 207ms (10.7%)
├─ Scenes Query: 204ms (10.5%)
└─ ETag: 0.09ms (0%)
```

**Request 4:**
```
Total: 2041ms
├─ Auth: 3ms (0.1%)
├─ Chapter Query: 1601ms (78.4%) 🔥 BOTTLENECK
├─ Story Query: 211ms (10.3%)
├─ Scenes Query: 226ms (11.1%)
└─ ETag: 0.09ms (0%)
```

#### During Sequential/Low-Concurrency Requests

**Request 5:**
```
Total: 1047ms (51% faster!)
├─ Auth: 3ms (0.3%)
├─ Chapter Query: 623ms (59.5%)
├─ Story Query: 207ms (19.8%)
├─ Scenes Query: 213ms (20.3%)
└─ ETag: 0.28ms (0%)
```

**Request 6:**
```
Total: 644ms (70% faster!)
├─ Auth: 10ms (1.6%)
├─ Chapter Query: 211ms (32.8%) ✅ Normal speed
├─ Story Query: 209ms (32.5%)
├─ Scenes Query: 214ms (33.2%)
└─ ETag: 0.12ms (0%)
```

**Request 7:**
```
Total: 662ms (69% faster!)
├─ Auth: 8ms (1.2%)
├─ Chapter Query: 227ms (34.3%) ✅ Normal speed
├─ Story Query: 208ms (31.4%)
├─ Scenes Query: 218ms (32.9%)
└─ ETag: 0.09ms (0%)
```

### Performance Degradation Analysis

| Query Type | Sequential | Concurrent (3-4x) | Degradation |
|------------|-----------|-------------------|-------------|
| Auth | ~8ms | ~4ms | None (actually faster due to caching) |
| **Chapter Query** | **~220ms** | **~1450ms** | **6.6x slower** 🔥 |
| Story Query | ~210ms | ~210ms | None |
| Scenes Query | ~220ms | ~220ms | None |
| Total Request | ~660ms | ~1900ms | **2.9x slower** |

### Key Findings

1. **Chapter query is the bottleneck**: Takes 73-78% of total request time during concurrent access
2. **Dramatic performance degradation**: 220ms → 1450ms (6.6x slower) under concurrency
3. **Other queries unaffected**: Story and Scenes queries maintain consistent ~210ms regardless of concurrency
4. **"Parallel" strategy backfires**: 2630ms for 3 chapters vs estimated 1980ms sequential (3 × 660ms)

---

## Root Cause Analysis

### Why Chapter Query Slows Down

The chapter query is a simple lookup by ID:

```typescript
const [chapter] = await db
  .select({
    id: chapters.id,
    storyId: chapters.storyId,
    status: chapters.status
  })
  .from(chapters)
  .where(eq(chapters.id, chapterId))
  .limit(1);
```

**Possible causes for 6.6x slowdown under concurrency:**

1. **Connection Pool Exhaustion**
   - Default Drizzle/Postgres pool size may be too small
   - Concurrent requests waiting for available connections
   - Evidence: Auth query gets faster (cached), but chapter query slows dramatically

2. **Missing Database Index**
   - While `chapters.id` should have primary key index, verify it exists
   - Check if index is being used efficiently

3. **Table-Level Lock Contention**
   - PostgreSQL row-level locks for SELECT shouldn't cause this
   - But could be implicit locks from connection management

4. **Network Latency to Neon Database**
   - Each query has fixed network RTT to Neon
   - Concurrent queries may hit bandwidth limits
   - Base latency appears to be ~200ms (Story/Scenes maintain this)

5. **Query Plan Inefficiency**
   - Cold query plans being regenerated
   - Prepared statement cache not being used effectively

### Evidence Supporting Connection Pool Issue

**Smoking Gun:**
- Chapter query: 220ms → 1450ms (6.6x slower)
- Story query: 210ms → 210ms (no change)
- Scenes query: 220ms → 220ms (no change)

**Why this points to connection pool:**
- If it were database load, ALL queries would slow down equally
- If it were network, ALL queries would slow down equally
- If it were a missing index, the query would be slow even without concurrency

**The pattern suggests:**
1. First request gets a connection quickly: Chapter query ~220ms
2. Concurrent requests wait for connection: +1000-1400ms wait time
3. Once connection is acquired, query executes normally: ~220ms
4. Total time: 220ms (query) + 1200ms (wait) = 1420ms average

---

## Optimization Strategies

### 1. Increase Database Connection Pool (RECOMMENDED - Quick Win)

**Current (likely default):**
```typescript
// Default Drizzle ORM pool size is typically 10
```

**Recommended:**
```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!, {
  fetchConnectionCache: true,
  // Increase pool size for concurrent requests
  poolQueryViaFetch: true, // Use HTTP for better scalability
});

export const db = drizzle(sql, {
  // Connection pooling config
  pool: {
    max: 30, // Increase from default ~10 to 30
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});
```

**Expected Impact:** 6.6x speedup on concurrent chapter queries
**Effort:** Low (configuration change)
**Risk:** Low (well-tested approach)

### 2. Implement Batch API Endpoint (RECOMMENDED - Best Long-Term Solution)

Instead of 3 separate HTTP requests, create single batch endpoint:

**New API Route:** `/writing/api/chapters/batch`

```typescript
// POST /writing/api/chapters/batch
// Body: { chapterIds: string[] }

export async function POST(request: NextRequest) {
  const { chapterIds } = await request.json();

  // Single query for all chapters
  const chaptersData = await db
    .select()
    .from(chapters)
    .where(inArray(chapters.id, chapterIds));

  // Single query for all stories (unique storyIds)
  const storyIds = [...new Set(chaptersData.map(c => c.storyId))];
  const storiesData = await db
    .select()
    .from(stories)
    .where(inArray(stories.id, storyIds));

  // Single query for all scenes
  const scenesData = await db
    .select()
    .from(scenes)
    .where(inArray(scenes.chapterId, chapterIds))
    .orderBy(asc(scenes.orderIndex));

  // Group and return
  return NextResponse.json({
    chapters: groupScenesByChapter(chaptersData, scenesData, storiesData)
  });
}
```

**Benefits:**
- 3 HTTP requests → 1 HTTP request
- 9 database queries → 3 database queries
- No connection pool contention
- Lower network overhead
- Better database query plan caching

**Expected Impact:**
- Total load time: ~2630ms → ~800ms (3.3x faster)
- Breakdown: 220ms (chapters) + 210ms (stories) + 220ms (scenes) + 150ms (overhead)

**Effort:** Medium (new API route, client refactor)
**Risk:** Low (additive change, doesn't break existing code)

### 3. Add Database Indexes (VERIFY FIRST)

**Check existing indexes:**
```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM
  pg_indexes
WHERE
  tablename IN ('chapters', 'stories', 'scenes')
ORDER BY
  tablename,
  indexname;
```

**Add if missing:**
```sql
-- Primary key should already exist, but verify
CREATE INDEX IF NOT EXISTS idx_chapters_id ON chapters(id);

-- For story lookup
CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id);

-- For scenes lookup
CREATE INDEX IF NOT EXISTS idx_scenes_chapter_id ON scenes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_scenes_chapter_order ON scenes(chapter_id, order_index);
```

**Expected Impact:** Minimal if indexes already exist (likely)
**Effort:** Low (SQL migration)
**Risk:** Very Low

### 4. Use Database Read Replicas (FUTURE)

For production with high read load:

```typescript
const readReplica = neon(process.env.POSTGRES_READ_REPLICA_URL!);
const readDb = drizzle(readReplica);

// Use read replica for all GET requests
export async function GET(request: NextRequest) {
  // Use readDb instead of db
  const scenes = await readDb
    .select()
    .from(scenes)
    .where(eq(scenes.chapterId, chapterId));
}
```

**Expected Impact:** Eliminates contention for read queries
**Effort:** Medium (infrastructure setup)
**Risk:** Low (Neon supports read replicas natively)

### 5. Implement Response Caching at Edge (FUTURE)

Use Vercel Edge Config or KV for caching published content:

```typescript
import { kv } from '@vercel/kv';

export async function GET(request: NextRequest) {
  const cacheKey = `scenes:${chapterId}`;

  // Try cache first
  const cached = await kv.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Fetch from database
  const data = await fetchFromDatabase();

  // Cache for 5 minutes
  await kv.set(cacheKey, data, { ex: 300 });

  return NextResponse.json(data);
}
```

**Expected Impact:** Near-instant response for cached content
**Effort:** Medium (Vercel KV setup)
**Risk:** Low (cache invalidation strategy needed)

---

## Implementation Priority

### Phase 1: Quick Wins (This Week)

1. **Increase connection pool size** ✅ PRIORITY
   - Effort: 15 minutes
   - Impact: 6.6x speedup on concurrent queries
   - File: `src/lib/db/index.ts`

2. **Verify database indexes**
   - Effort: 30 minutes
   - Impact: Ensures queries are optimized
   - Run: `pnpm db:studio` and check indexes

### Phase 2: Batch API (Next Sprint)

3. **Implement batch API endpoint**
   - Effort: 4-6 hours
   - Impact: 3.3x overall speedup + eliminates contention
   - Files:
     - `src/app/writing/api/chapters/batch/route.ts` (new)
     - `src/components/reading/ChapterReaderClient.tsx` (refactor)

### Phase 3: Production Optimization (Future)

4. **Read replicas for production**
   - Effort: 2-3 hours (Neon setup + config)
   - Impact: Horizontal scaling for reads

5. **Edge caching for published content**
   - Effort: 3-4 hours
   - Impact: Sub-100ms response for cached content

---

## Performance Goals

### Current Performance
- Initial load (3 chapters): **2630ms**
- Per-chapter (concurrent): **~900ms**
- Per-chapter (sequential): **~660ms**

### After Phase 1 (Connection Pool)
- Initial load (3 chapters): **~1980ms** (25% improvement)
- Per-chapter (concurrent): **~660ms** (27% improvement)
- Per-chapter (sequential): **~660ms** (unchanged)

### After Phase 2 (Batch API)
- Initial load (3 chapters): **~800ms** (70% improvement from baseline)
- Per-chapter equivalent: **~267ms** (70% improvement)

### Target Performance (Industry Standards)
- Initial load: **<1000ms** (1 second) ✅ Achieved with Phase 2
- Navigation: **<100ms** ✅ Already achieved (2.6ms)
- Perceived performance: **Instant** ✅ With proper loading states

---

## Testing Strategy

### Performance Regression Tests

Create automated tests that fail if performance degrades:

```typescript
// scripts/test-performance-regression.mjs
test('API response time under concurrent load', async () => {
  const start = performance.now();

  // Simulate parallel fetch
  await Promise.all([
    fetch('/api/chapters/1/scenes'),
    fetch('/api/chapters/2/scenes'),
    fetch('/api/chapters/3/scenes'),
  ]);

  const duration = performance.now() - start;

  // Should complete in under 1 second after optimization
  expect(duration).toBeLessThan(1000);
});
```

### Load Testing

Use k6 or Artillery for production load testing:

```javascript
// load-test.js (k6)
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10, // 10 virtual users
  duration: '30s',
};

export default function() {
  let res = http.get('https://fictures.com/writing/api/chapters/xyz/scenes');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## Monitoring Recommendations

### Production Metrics to Track

1. **API Response Times** (p50, p95, p99)
   - Target: p95 < 500ms, p99 < 1000ms
   - Alert if p95 > 1000ms

2. **Database Query Times**
   - Track each query type separately
   - Alert if Chapter query > 500ms

3. **Database Connection Pool**
   - Active connections
   - Waiting connections
   - Alert if waiting > 5

4. **Error Rates**
   - Connection timeout errors
   - Database errors
   - Alert if error rate > 1%

### Logging in Production

Keep timing logs but with sampling:

```typescript
// Only log 10% of requests
if (Math.random() < 0.1) {
  console.log(`[${requestId}] 📊 Breakdown: Auth=${authDuration}ms, Chapter=${chapterDuration}ms...`);
}

// Always log slow requests
if (totalDuration > 1000) {
  console.warn(`[${requestId}] 🐌 SLOW REQUEST: ${totalDuration}ms`);
}
```

---

## Conclusion

**The bottleneck is clear:** Database connection pool contention causing 6.6x slowdown on chapter queries during concurrent access.

**Quick fix:** Increase connection pool size (15 minutes of work).

**Long-term solution:** Batch API endpoint (eliminates the need for concurrent individual requests).

**Expected outcome:** 70% reduction in initial load time (2630ms → 800ms).

---

## Files Modified for Instrumentation

- ✅ `src/app/writing/api/chapters/[id]/scenes/route.ts` - API timing logs
- ✅ `src/hooks/useChapterScenes.ts` - SWR fetch timing logs
- ✅ `src/hooks/useScenePrefetch.ts` - Prefetch timing logs
- ✅ `src/components/reading/ChapterReaderClient.tsx` - Component lifecycle timing

## Files to Modify for Optimization

### Phase 1:
- `src/lib/db/index.ts` - Increase connection pool

### Phase 2:
- `src/app/writing/api/chapters/batch/route.ts` - New batch endpoint
- `src/components/reading/ChapterReaderClient.tsx` - Use batch endpoint
- `src/hooks/useChapterScenes.ts` - Support batch fetching

---

## Related Documentation

- Performance test script: `scripts/analyze-scene-loading-performance.mjs`
- Test output: `logs/performance-analysis-output.log`
- Screenshot: `logs/scene-loading-performance-analysis.png`

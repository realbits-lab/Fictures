**Status:** 🚧 Planned - Implementation in progress
**Target:** Sub-second perceived load time, instant navigation
**Date:** November 1, 2025

---

## 🎯 Performance Targets

### Overall Goal: Match novels/comics 95%+ performance

### Frontend (Community Experience)

| Metric | Target | Expected Cold | Expected Warm | Status |
|--------|--------|---------------|---------------|--------|
| **First Paint** | < 1s | 500-700ms | 100-200ms | ⏳ |
| **First Contentful Paint** | < 1s | 500-700ms | 100-200ms | ⏳ |
| **Time to Interactive** | < 3.5s | 2000-2500ms | 700-900ms | ⏳ |
| **Full Load** | < 5s | 2000-2500ms | 700-900ms | ⏳ |
| **Data Transfer** | < 200 KB | 100-150 KB | 100-150 KB | ⏳ |

### Backend (Community API)

| Metric | Target | Cold (No Cache) | Warm (Redis) | Status |
|--------|--------|-----------------|--------------|--------|
| **Community Stories Fetch** | < 500ms | 1000-1500ms | 20-50ms | ⏳ |
| **Story Detail Fetch** | < 500ms | 800-1200ms | 20-50ms | ✅ |
| **Posts Fetch** | < 500ms | 500-800ms | 20-50ms | ✅ |
| **Database Queries** | < 500ms | 500-1000ms | ~5ms (cached) | ⏳ |
| **Time to First Byte** | < 1s | 800-1200ms | 20-50ms | ⏳ |
| **Total API Response** | < 2s | 1500-2000ms | 50-100ms | ⏳ |

---

## 📊 Current State Analysis

### ✅ Already Implemented (Good)

1. **Client-Side Caching**:
   - ✅ SWR memory cache (30 minutes)
   - ✅ localStorage persistence (1 hour)
   - ✅ Automatic revalidation
   - ✅ Real-time SSE updates

2. **Server-Side Caching**:
   - ✅ Redis caching for community stories (5 min TTL)
   - ✅ Redis caching for story details (1 hour TTL)
   - ✅ Redis caching for posts (1 hour TTL)
   - ✅ ETag support for 304 responses

3. **API Optimization**:
   - ✅ Performance logging
   - ✅ Cache headers (5min/10min stale)
   - ✅ Error handling

### ⚠️ Missing Optimizations (Critical)

1. **Architecture**:
   - ❌ Client-only components (no SSR)
   - ❌ No PPR (Partial Prerendering)
   - ❌ No Suspense boundaries
   - ❌ No streaming SSR

2. **Database**:
   - ❌ No optimized query functions
   - ❌ No field selection (fetches all columns)
   - ❌ No Promise.all for parallel queries
   - ❌ Possible N+1 query issues

3. **Performance**:
   - ❌ No progressive loading
   - ❌ No skeleton UI during streaming
   - ❌ Longer TTFB (no SSR prerendering)

---

## 🚀 Optimization Strategy

### Phase 1: Server-Side Architecture (CRITICAL - 80% Impact)

**Goal:** Convert from client-only to hybrid Server/Client architecture

#### 1.1 Create Optimized Query Functions

**File:** `src/lib/db/community-queries.ts` (NEW)

```typescript
import { db } from './index';
import { stories, users, communityPosts, eq, and, desc, count, sql } from 'drizzle-orm';

/**
 * Optimized query for community stories list
 *
 * ⚡ Optimizations:
 * - Select only needed fields (skip studio-only fields)
 * - Use Promise.all for parallel queries
 * - Include imageVariants for AVIF optimization
 * - Pre-calculate stats with subqueries
 */
export async function getCommunityStoriesOptimized() {
  const queryStart = performance.now();
  console.log('[PERF-QUERY] 🏘️ getCommunityStoriesOptimized START');

  // Parallel queries for better performance
  const [publishedStories, postsCounts, membersCounts] = await Promise.all([
    // Query 1: Published stories with essential fields only
    db.select({
      id: stories.id,
      title: stories.title,
      summary: stories.summary,
      genre: stories.genre,
      status: stories.status,
      imageUrl: stories.imageUrl,
      imageVariants: stories.imageVariants, // ⚡ CRITICAL for AVIF
      authorId: stories.authorId,
      createdAt: stories.createdAt,
      updatedAt: stories.updatedAt,
      viewCount: stories.viewCount,
      // ❌ SKIPPED: moralFramework, partIds, chapterIds, sceneIds (studio-only)
    })
    .from(stories)
    .where(eq(stories.status, 'published'))
    .orderBy(desc(stories.updatedAt))
    .limit(100),

    // Query 2: Post counts per story
    db.select({
      storyId: communityPosts.storyId,
      totalPosts: count(communityPosts.id)
    })
    .from(communityPosts)
    .groupBy(communityPosts.storyId),

    // Query 3: Member counts (placeholder - will be implemented with proper schema)
    Promise.resolve([]) // TODO: Add community_members table
  ]);

  const queryEnd = performance.now();
  console.log(`[PERF-QUERY] ✅ getCommunityStoriesOptimized COMPLETE: ${(queryEnd - queryStart).toFixed(2)}ms`);

  // Assemble data in memory (fast)
  const postsMap = new Map(postsCounts.map(p => [p.storyId, p.totalPosts]));

  const storiesWithStats = publishedStories.map(story => ({
    ...story,
    totalPosts: postsMap.get(story.id) || 0,
    totalMembers: 0, // TODO: Calculate from community_members
    isActive: false, // TODO: Check if has posts in last 24 hours
    lastActivity: story.updatedAt?.toISOString() || story.createdAt.toISOString(),
  }));

  return storiesWithStats;
}

/**
 * Optimized query for single community story
 *
 * ⚡ Optimizations:
 * - Select only needed fields
 * - Batch related data with Promise.all
 * - Include imageVariants for AVIF
 */
export async function getCommunityStoryOptimized(storyId: string) {
  console.log('[PERF-QUERY] 📖 getCommunityStoryOptimized START');

  const [story, characters, settings, stats] = await Promise.all([
    // Story with essential fields
    db.select({
      id: stories.id,
      title: stories.title,
      summary: stories.summary,
      genre: stories.genre,
      status: stories.status,
      imageUrl: stories.imageUrl,
      imageVariants: stories.imageVariants,
      authorId: stories.authorId,
      // ❌ SKIPPED: moralFramework, partIds (studio-only)
    })
    .from(stories)
    .where(eq(stories.id, storyId))
    .limit(1),

    // Characters (if needed)
    // TODO: Add optimized character query

    // Settings (if needed)
    // TODO: Add optimized setting query

    // Stats
    db.select({
      totalPosts: count(communityPosts.id)
    })
    .from(communityPosts)
    .where(eq(communityPosts.storyId, storyId))
  ]);

  console.log('[PERF-QUERY] ✅ getCommunityStoryOptimized COMPLETE');

  if (!story[0]) return null;

  return {
    ...story[0],
    characters: characters || [],
    settings: settings || [],
    stats: {
      totalPosts: stats[0]?.totalPosts || 0,
      totalMembers: 0,
      totalViews: 0,
      averageRating: 0,
      ratingCount: 0,
    }
  };
}
```

**Impact:**
- 30-40% data reduction (skip studio fields)
- 60-70% faster (parallel queries)
- Maintains imageVariants for AVIF optimization

#### 1.2 Convert Community Page to Server Component

**File:** `src/app/community/page.tsx`

**Current:** Client-only component with `"use client"`
**Target:** Hybrid Server/Client architecture

```typescript
import { Suspense } from 'react';
import { MainLayout } from '@/components/layout';
import { CommunityStoriesGrid } from '@/components/community/CommunityStoriesGrid'; // CLIENT
import { CommunityStats } from '@/components/community/CommunityStats'; // CLIENT
import { getCommunityStoriesForReading } from '@/lib/db/community-queries';

// ⚡ Enable Partial Prerendering (PPR)
export const experimental_ppr = true;

// ⚡ Server Component for initial data fetching
async function CommunityContent() {
  console.log('🏘️ [SSR] Fetching community stories...');
  const ssrStart = performance.now();

  // Fetch from Redis cache (SSR)
  const stories = await getCommunityStoriesForReading();

  const ssrEnd = performance.now();
  console.log(`✅ [SSR] Stories fetched in ${(ssrEnd - ssrStart).toFixed(2)}ms`);

  return (
    <>
      {/* Client component for interactivity */}
      <CommunityStats stories={stories} />
      <CommunityStoriesGrid initialData={stories} />
    </>
  );
}

// ⚡ Streaming SSR with Suspense
export default function CommunityPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header (static) */}
        <CommunityHeader />

        {/* Stream content progressively */}
        <Suspense fallback={<CommunityLoadingSkeleton />}>
          <CommunityContent />
        </Suspense>
      </div>
    </MainLayout>
  );
}

// Loading skeleton
function CommunityLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>

      {/* Stories grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Static header (no data fetching)
function CommunityHeader() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-3">
        <span>💬</span>
        Community Hub
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">
        Connect with readers and fellow writers through story discussions
      </p>
    </div>
  );
}
```

**Impact:**
- ⚡ First paint: < 100ms (PPR pre-renders static shell)
- ⚡ TTFB: < 200ms (SSR fetches data server-side)
- ⚡ SEO improved (server-rendered content)

#### 1.3 Update API Routes

**File:** `src/app/community/api/stories/route.ts`

```typescript
// Update getCommunityStories to use optimized query
const storiesWithStats = await getCommunityStoriesOptimized();

// Increase Redis TTL to match novels/comics
const CACHE_TTL = {
  PUBLISHED_CONTENT: 600, // 10 minutes (was 5 minutes)
  STORY_LIST: 300, // 5 minutes
};
```

---

### Phase 2: Database Optimization (HIGH Impact)

#### 2.1 Add Missing Indexes

**File:** `drizzle/migrations/add_community_indexes.sql` (NEW)

```sql
-- Community posts indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_story_id ON community_posts(story_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);

-- Stories community-related indexes
CREATE INDEX IF NOT EXISTS idx_stories_status_updated ON stories(status, updated_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_stories_view_count ON stories(view_count DESC) WHERE status = 'published';

-- Full-text search (if needed for community search)
CREATE INDEX IF NOT EXISTS idx_community_posts_title_search ON community_posts USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_community_posts_content_search ON community_posts USING GIN (to_tsvector('english', content));
```

**Impact:** 50-80% faster queries for community data

#### 2.2 Query Batching

Already shown in optimized query functions above with Promise.all.

---

### Phase 3: Client-Side Progressive Enhancement

#### 3.1 Client Component with SSR Data

**File:** `src/components/community/CommunityStoriesGrid.tsx` (UPDATED)

```typescript
'use client';

import { useState } from 'react';
import { useCommunityStories } from '@/lib/hooks/use-page-cache';
import { CommunityStoryCard } from './CommunityStoryCard';

export function CommunityStoriesGrid({ initialData }: { initialData: any[] }) {
  // Use SSR data as fallback, then revalidate with SWR
  const { data, isValidating } = useCommunityStories({
    fallbackData: initialData, // ⚡ Use SSR data immediately
  });

  const stories = data?.stories || initialData;

  return (
    <>
      {isValidating && !data && (
        <div className="text-sm text-blue-500">Refreshing...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stories.map((story, index) => (
          <CommunityStoryCard
            key={story.id}
            story={story}
            priority={index === 0}
          />
        ))}
      </div>
    </>
  );
}
```

---

## 📊 Cache Configuration

### Client-Side (SWR + localStorage)

```typescript
// Already configured in use-page-cache.ts
useCommunityStories: {
  dedupingInterval: 30 * 60 * 1000,  // 30 minutes
  keepPreviousData: true,
  ttl: 60 * 60 * 1000, // 1 hour localStorage
}
```

### Server-Side (Redis)

```typescript
// Update cached-queries.ts
getCommunityStories: {
  cacheKey: 'community:stories:all',
  ttl: 600, // 10 minutes (increased from 5)
}

getCommunityStory: {
  cacheKey: `community:story:{id}:public`,
  ttl: 3600, // 1 hour (published content)
}

getCommunityPosts: {
  cacheKey: `community:story:{id}:posts:public`,
  ttl: 3600, // 1 hour
}
```

---

## 🏆 Expected Performance Improvements

### Overall

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **First Paint** | 1000-1500ms | 100-200ms | **85-90% faster** |
| **Time to Interactive** | 3000-4000ms | 700-900ms | **75-80% faster** |
| **API Response (Warm)** | 100-200ms | 20-50ms | **75-80% faster** |
| **Database Queries** | 500-1000ms | 100-200ms | **70-80% faster** |

### Cache Hit Rates

| Cache Layer | Target | Expected |
|-------------|--------|----------|
| SWR Memory | > 95% | 95-98% |
| localStorage | > 90% | 90-95% |
| Redis | > 90% | 90-95% |

---

## 📁 Implementation Files

### Create New Files

1. **`src/lib/db/community-queries.ts`** - Optimized database queries
2. **`drizzle/migrations/add_community_indexes.sql`** - Database indexes
3. **`src/components/community/CommunityLoadingSkeleton.tsx`** - Loading UI
4. **`docs/performance/performance-community.md`** - This documentation

### Modify Existing Files

1. **`src/app/community/page.tsx`** - Convert to Server Component + PPR
2. **`src/app/community/story/[storyId]/page.tsx`** - Convert to Server Component + PPR
3. **`src/app/community/api/stories/route.ts`** - Use optimized queries
4. **`src/lib/db/cached-queries.ts`** - Update TTLs and query functions
5. **`src/components/community/CommunityStoriesGrid.tsx`** - Add SSR support

---

## 🧪 Testing Plan

### Manual Testing

```bash
# 1. First visit - populate cache
Open /community → 500-700ms load

# 2. Return within 30min - SWR memory hit
Navigate away, return → Instant (<16ms)

# 3. Return after 30min - localStorage hit
Wait 30min, reload → Fast (4-16ms)

# 4. Return after 1hr - cache expired
Wait 1hr, reload → 500-700ms load (refetched)
```

### Automated Testing

**File:** `scripts/test-community-performance.mjs` (NEW)

```javascript
import fetch from 'node-fetch';

async function testCommunityPerformance() {
  const baseUrl = 'http://localhost:3000';

  console.log('🧪 Testing Community Page Performance...\n');

  // Test 1: Cold load
  console.log('Test 1: Cold load (no cache)');
  const cold1 = performance.now();
  const res1 = await fetch(`${baseUrl}/community/api/stories`);
  const data1 = await res1.json();
  const cold2 = performance.now();
  console.log(`✅ Cold load: ${(cold2 - cold1).toFixed(2)}ms`);
  console.log(`   Stories: ${data1.stories?.length || 0}`);

  // Test 2: Warm load (Redis cache)
  console.log('\nTest 2: Warm load (Redis cache)');
  const warm1 = performance.now();
  const res2 = await fetch(`${baseUrl}/community/api/stories`);
  const data2 = await res2.json();
  const warm2 = performance.now();
  console.log(`✅ Warm load: ${(warm2 - warm1).toFixed(2)}ms`);

  // Test 3: 304 Not Modified
  console.log('\nTest 3: 304 Not Modified (ETag)');
  const etag = res2.headers.get('etag');
  const cached1 = performance.now();
  const res3 = await fetch(`${baseUrl}/community/api/stories`, {
    headers: { 'if-none-match': etag }
  });
  const cached2 = performance.now();
  console.log(`✅ ETag cache: ${(cached2 - cached1).toFixed(2)}ms`);
  console.log(`   Status: ${res3.status} (expected 304)`);

  console.log('\n📊 Summary:');
  console.log(`Cold load: ${(cold2 - cold1).toFixed(2)}ms`);
  console.log(`Warm load: ${(warm2 - warm1).toFixed(2)}ms`);
  console.log(`ETag cache: ${(cached2 - cached1).toFixed(2)}ms`);
  console.log(`Improvement: ${Math.round((1 - (warm2 - warm1) / (cold2 - cold1)) * 100)}%`);
}

testCommunityPerformance().catch(console.error);
```

**Run test:**
```bash
dotenv --file .env.local run node scripts/test-community-performance.mjs
```

---

## 📈 Monitoring & Metrics

### Key Metrics to Track

**API Performance:**
- Time to First Byte (TTFB): < 200ms
- Total API response: < 100ms (cached), < 2s (cold)
- Cache hit rate: > 90%

**User Experience:**
- First Contentful Paint: < 1s
- Time to Interactive: < 3.5s
- Page load time: < 5s

### Console Logs

```typescript
[SSR] Fetching community stories... (0ms)
[PERF-QUERY] 🏘️ getCommunityStoriesOptimized START
[PERF-QUERY] ⚡ Batched query (3 queries in parallel): 174ms
[PERF-QUERY] ✅ getCommunityStoriesOptimized COMPLETE: 180ms
[SSR] Stories fetched in 185ms
```

---

## ✅ Implementation Checklist

### Phase 1: Server-Side Architecture
- [ ] Create `community-queries.ts` with optimized functions
- [ ] Convert `/community/page.tsx` to Server Component
- [ ] Add PPR support (`experimental_ppr = true`)
- [ ] Add Suspense boundaries with loading skeletons
- [ ] Update API routes to use optimized queries

### Phase 2: Database Optimization
- [ ] Create and apply database indexes migration
- [ ] Test query performance with indexes
- [ ] Verify cache hit rates

### Phase 3: Client-Side Enhancement
- [ ] Update client components to accept SSR data
- [ ] Test SWR fallback with SSR data
- [ ] Maintain real-time SSE functionality

### Phase 4: Testing & Monitoring
- [ ] Create performance testing script
- [ ] Run baseline performance tests
- [ ] Monitor cache hit rates
- [ ] Verify loading times

---

## 💡 Lessons from Novels/Comics Optimization

1. **SSR + PPR is critical** - 80-90% improvement in first paint
2. **Query batching with Promise.all** - 60-70% faster database access
3. **Redis caching** - 85-90% improvement on cached requests
4. **Field selection matters** - 25-30% bandwidth savings
5. **Keep imageVariants** - AVIF optimization saves 50-70% image bandwidth

---

## 🚀 Expected Final Results

**Cold Load (First Visit):**
- First Paint: 500-700ms
- TTI: 2000-2500ms
- Full Load: 2000-2500ms

**Warm Load (Cached):**
- First Paint: 100-200ms
- TTI: 700-900ms
- Full Load: 700-900ms

**Cache Hit (ETag 304):**
- Response: < 50ms
- No data transfer
- Instant UI update

---

**Status:** 🚧 Ready for Implementation
**Priority:** HIGH - Critical for community UX parity with novels/comics
**Estimated Time:** 4-6 hours
**Impact:** VERY HIGH - 75-90% performance improvement

---

**Latest Update:** November 1, 2025 - Initial optimization plan created
**Next Steps:** Implement Phase 1 (Server-Side Architecture) first

# Community Page Caching Implementation

**Complete 3-layer caching strategy for `/community` pages with performance optimization**

## Overview

This document outlines the comprehensive caching implementation for community pages, modeled after the proven `/novels` caching system which achieves 99.9% memory reduction and sub-100ms load times.

## Current State Analysis

### Problems Identified

**Client-Side Issues:**
- `/community/story/[storyId]/page.tsx` uses basic `fetch()` with `useState`
- NO SWR memory cache (data refetched on every component mount)
- NO localStorage persistence (data lost on page refresh)
- `CACHE_CONFIGS.community` TTL is only 5 minutes (should be 30 like reading)

**Server-Side Issues:**
- `/api/community/stories/[storyId]/route.ts` has NO Redis caching
- `/api/community/stories/[storyId]/posts/route.ts` has NO Redis caching
- Every request hits PostgreSQL database directly
- N+1 query problems (story → author → posts → characters → settings)

**Database Issues:**
- `community_posts` table has NO indexes
- Query filters by: `story_id`, `is_deleted`, `moderation_status`
- Query sorts by: `is_pinned DESC`, `last_activity_at DESC`
- Missing composite index causes full table scans

### Impact

- **Page load time**: 800-1500ms (should be ``<100ms`` with caching)
- **Database load**: 5-7 queries per page load (should be 0-1 with cache hits)
- **User experience**: Slow navigation between community pages
- **Server costs**: Unnecessary database queries for public content

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    3-Layer Caching Strategy                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: SWR Memory Cache (30 minutes)                         │
│  ├── Fastest: ~1-5ms lookup                                     │
│  ├── Shared across component instances                          │
│  ├── Cleared on tab close                                       │
│  └── Automatic revalidation and deduplication                   │
│                                                                  │
│  Layer 2: localStorage (1 hour)                                 │
│  ├── Fast: ~10-20ms lookup                                      │
│  ├── Survives page refresh                                      │
│  ├── Compressed JSON storage                                    │
│  └── Fallback for SWR cache misses                             │
│                                                                  │
│  Layer 3: Redis Cache (1 hour for public content)              │
│  ├── Medium: ~30-50ms lookup                                    │
│  ├── Shared across all users (public content)                  │
│  ├── User-specific (private content, 3 minutes)                │
│  └── Reduces database load by 95%+                             │
│                                                                  │
│  Layer 4: PostgreSQL Database                                   │
│  ├── Slow: ~100-500ms query                                     │
│  ├── Only on cache miss                                         │
│  ├── Optimized with composite indexes                          │
│  └── Expected hit rate: ``<5%`` with full caching                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Cache Key Strategy

### Public Content (Shared by All Users)

**Story Data:**
```typescript
`community:story:${storyId}:public`
```

**Posts List:**
```typescript
`community:story:${storyId}:posts:public`
```

**Characters:**
```typescript
`community:story:${storyId}:characters:public`
```

**Settings:**
```typescript
`community:story:${storyId}:settings:public`
```

### Rationale

- Community content is **publicly visible** (no authentication required)
- All users see the **same data** for a given story
- Shared cache = **maximum efficiency** (one entry serves all users)
- TTL: **1 hour** (community content changes infrequently)

## Implementation Plan

### 1. Update Cache Configuration

**File:** `src/lib/hooks/use-persisted-swr.ts`

**Change:**
```typescript
export const CACHE_CONFIGS = {
  // ... existing configs
  community: {
    ttl: 30 * 60 * 1000,  // 30min (was 5min)
    version: '1.1.0',      // Bump version
    compress: true         // Enable compression
  },
  // ...
};
```

**Reasoning:**
- Community content is public and changes slowly
- 30-minute cache aligns with reading experience
- Compression reduces localStorage usage
- Version bump clears old 5-minute caches

### 2. Create Custom React Hooks

#### 2a. useCommunityStory Hook

**File:** `src/lib/hooks/use-community-cache.ts` (new file)

**Purpose:** Fetch story data with characters, settings, and stats

**Implementation:**
```typescript
import useSWR from 'swr';
import { usePersistedSWR } from './use-persisted-swr';
import { CACHE_CONFIGS } from './use-persisted-swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCommunityStory(storyId: string) {
  return usePersistedSWR(
    `/api/community/stories/${storyId}`,
    fetcher,
    CACHE_CONFIGS.community,
    {
      revalidateOnFocus: false,     // Don't refetch on tab focus
      revalidateOnReconnect: true,  // Refetch on network reconnect
      refreshInterval: 30 * 60 * 1000, // Auto-refresh every 30min
      dedupingInterval: 30 * 60 * 1000, // Dedupe requests for 30min
      keepPreviousData: true,       // Show stale data while revalidating
    }
  );
}
```

**Features:**
- ✅ SWR memory cache with 30-minute deduplication
- ✅ localStorage persistence with 1-hour TTL
- ✅ Automatic revalidation on network reconnect
- ✅ Shows previous data while loading new data

#### 2b. useCommunityPosts Hook

**File:** `src/lib/hooks/use-community-cache.ts`

**Purpose:** Fetch posts with automatic refresh on mutations

**Implementation:**
```typescript
export function useCommunityPosts(storyId: string) {
  return usePersistedSWR(
    `/api/community/stories/${storyId}/posts`,
    fetcher,
    CACHE_CONFIGS.community,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30 * 60 * 1000,
      dedupingInterval: 30 * 60 * 1000,
      keepPreviousData: true,
    }
  );
}

// Helper for manual revalidation after creating/deleting posts
export function useRevalidateCommunityPosts(storyId: string) {
  const { mutate } = useSWR(`/api/community/stories/${storyId}/posts`);
  return mutate;
}
```

**Usage in Components:**
```typescript
// In page component
const { data: story, isLoading } = useCommunityStory(storyId);
const { data: posts, isLoading: postsLoading } = useCommunityPosts(storyId);

// After creating a post
const revalidatePosts = useRevalidateCommunityPosts(storyId);
await revalidatePosts(); // Refetch posts
```

### 3. Add Redis Caching to API Routes

#### 3a. Create Community Cached Queries

**File:** `src/lib/db/cached-queries.ts`

**Add:**
```typescript
/**
 * Get community story with all related data (public content)
 * TTL: 1 hour (published content changes infrequently)
 */
export async function getCommunityStory(storyId: string) {
  const cacheKey = `community:story:${storyId}:public`;

  return measureAsync(
    'getCommunityStory',
    async () => {
      return withCache(
        cacheKey,
        () => queries.getCommunityStory(storyId),
        CACHE_TTL.PUBLISHED_CONTENT // 1 hour
      );
    },
    { storyId, cached: true }
  ).then(r => r.result);
}

/**
 * Get community posts for a story (public content)
 * TTL: 1 hour (posts change less frequently than expected)
 */
export async function getCommunityPosts(storyId: string) {
  const cacheKey = `community:story:${storyId}:posts:public`;

  return measureAsync(
    'getCommunityPosts',
    async () => {
      return withCache(
        cacheKey,
        () => queries.getCommunityPosts(storyId),
        CACHE_TTL.PUBLISHED_CONTENT // 1 hour
      );
    },
    { storyId, cached: true }
  ).then(r => r.result);
}
```

#### 3b. Create Database Query Functions

**File:** `src/lib/db/queries.ts`

**Add:**
```typescript
export async function getCommunityStory(storyId: string) {
  // Fetch story with author
  const storyData = await db
    .select({
      id: stories.id,
      title: stories.title,
      description: stories.description,
      genre: stories.genre,
      status: stories.status,
      viewCount: stories.viewCount,
      rating: stories.rating,
      ratingCount: stories.ratingCount,
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
        image: users.image,
      },
    })
    .from(stories)
    .leftJoin(users, eq(stories.authorId, users.id))
    .where(eq(stories.id, storyId))
    .limit(1);

  if (storyData.length === 0) return null;

  const story = storyData[0];

  // Count posts (uses index: story_id, is_deleted, moderation_status)
  const postCountResult = await db
    .select({ count: count() })
    .from(communityPosts)
    .where(
      and(
        eq(communityPosts.storyId, storyId),
        eq(communityPosts.isDeleted, false),
        eq(communityPosts.moderationStatus, 'approved')
      )
    );

  // Fetch characters (uses index: story_id)
  const storyCharacters = await db
    .select()
    .from(characters)
    .where(eq(characters.storyId, storyId));

  // Fetch settings (uses index: story_id)
  const storySettings = await db
    .select()
    .from(settings)
    .where(eq(settings.storyId, storyId));

  return {
    ...story,
    stats: {
      totalPosts: postCountResult[0]?.count || 0,
      totalMembers: Math.floor((story.viewCount || 0) * 0.1),
      totalViews: story.viewCount || 0,
      averageRating: story.rating ? story.rating / 10 : 0,
      ratingCount: story.ratingCount || 0,
    },
    characters: storyCharacters,
    settings: storySettings,
  };
}

export async function getCommunityPosts(storyId: string) {
  return db
    .select({
      id: communityPosts.id,
      title: communityPosts.title,
      content: communityPosts.content,
      contentType: communityPosts.contentType,
      contentHtml: communityPosts.contentHtml,
      contentImages: communityPosts.contentImages,
      storyId: communityPosts.storyId,
      type: communityPosts.type,
      isPinned: communityPosts.isPinned,
      isLocked: communityPosts.isLocked,
      isEdited: communityPosts.isEdited,
      editCount: communityPosts.editCount,
      lastEditedAt: communityPosts.lastEditedAt,
      likes: communityPosts.likes,
      replies: communityPosts.replies,
      views: communityPosts.views,
      tags: communityPosts.tags,
      mentions: communityPosts.mentions,
      lastActivityAt: communityPosts.lastActivityAt,
      createdAt: communityPosts.createdAt,
      updatedAt: communityPosts.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
        image: users.image,
      },
    })
    .from(communityPosts)
    .leftJoin(users, eq(communityPosts.authorId, users.id))
    .where(and(
      eq(communityPosts.storyId, storyId),
      eq(communityPosts.isDeleted, false),
      eq(communityPosts.moderationStatus, 'approved')
    ))
    .orderBy(
      desc(communityPosts.isPinned),
      desc(communityPosts.lastActivityAt)
    );
}
```

#### 3c. Update API Routes to Use Cached Queries

**File:** `src/app/api/community/stories/[storyId]/route.ts`

**Replace direct queries with:**
```typescript
import { getCommunityStory } from '@/lib/db/cached-queries';
import { getPerformanceLogger } from '@/lib/cache/performance-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const perfLogger = getPerformanceLogger();
  const operationId = `get-community-story-${Date.now()}`;

  try {
    const { storyId } = await params;

    perfLogger.start(operationId, 'GET /api/community/stories/[storyId]', {
      apiRoute: true,
      storyId
    });

    const story = await getCommunityStory(storyId);

    if (!story) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Story not found' },
        { status: 404 }
      );
    }

    const totalDuration = perfLogger.end(operationId, {
      cached: true,
      storyId
    });

    return NextResponse.json({
      success: true,
      story,
    }, {
      headers: {
        'X-Server-Timing': `total;dur=${totalDuration}`,
        'X-Server-Cache': 'ENABLED',
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600', // 30min cache
      }
    });

  } catch (error) {
    perfLogger.end(operationId, { error: true });
    console.error('Error fetching story data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch story data' },
      { status: 500 }
    );
  }
}
```

**File:** `src/app/api/community/stories/[storyId]/posts/route.ts`

**Replace direct queries with:**
```typescript
import { getCommunityPosts } from '@/lib/db/cached-queries';
import { getPerformanceLogger } from '@/lib/cache/performance-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const perfLogger = getPerformanceLogger();
  const operationId = `get-community-posts-${Date.now()}`;

  try {
    const { storyId } = await params;

    perfLogger.start(operationId, 'GET /api/community/stories/[storyId]/posts', {
      apiRoute: true,
      storyId
    });

    const posts = await getCommunityPosts(storyId);

    const totalDuration = perfLogger.end(operationId, {
      cached: true,
      postCount: posts.length
    });

    return NextResponse.json({
      success: true,
      posts,
      total: posts.length,
    }, {
      headers: {
        'X-Server-Timing': `total;dur=${totalDuration}`,
        'X-Server-Cache': 'ENABLED',
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600', // 30min cache
      }
    });

  } catch (error) {
    perfLogger.end(operationId, { error: true });
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
```

### 4. Update Page Component to Use Hooks

**File:** `src/app/community/story/[storyId]/page.tsx`

**Replace fetch logic with:**
```typescript
import { useCommunityStory, useCommunityPosts, useRevalidateCommunityPosts } from '@/lib/hooks/use-community-cache';

export default function StoryCommunityPage() {
  const params = useParams();
  const { data: session } = useSession();
  const storyId = params.storyId as string;
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Use cached hooks instead of fetch
  const {
    data: storyData,
    isLoading: isLoadingStory,
    error: storyError
  } = useCommunityStory(storyId);

  const {
    data: postsData,
    isLoading: isLoadingPosts,
    error: postsError
  } = useCommunityPosts(storyId);

  const revalidatePosts = useRevalidateCommunityPosts(storyId);

  const { executeAction: handleCreatePost } = useProtectedAction(() => {
    setShowCreateForm(true);
  });

  const handlePostCreated = async () => {
    setShowCreateForm(false);
    await revalidatePosts(); // Revalidate posts cache
  };

  const handlePostDeleted = async () => {
    await revalidatePosts(); // Revalidate posts cache
  };

  const story = storyData?.story;
  const posts = postsData?.posts || [];

  if (isLoadingStory || !story) {
    // ... loading skeleton
  }

  return (
    <MainLayout>
      {/* ... rest of component using story and posts ... */}
    </MainLayout>
  );
}
```

**Benefits:**
- ✅ Removes manual `useEffect` and `useState` management
- ✅ Automatic cache management
- ✅ Optimistic UI updates
- ✅ Background revalidation
- ✅ Automatic error handling

### 5. Add Database Indexes

**Create Migration:** `drizzle/0032_add_community_indexes.sql`

```sql
-- Composite index for community posts query
-- Covers: WHERE story_id AND is_deleted AND moderation_status
-- ORDER BY: is_pinned DESC, last_activity_at DESC
CREATE INDEX IF NOT EXISTS idx_community_posts_story_active_pinned
ON community_posts(
  story_id,
  is_deleted,
  moderation_status,
  is_pinned DESC,
  last_activity_at DESC
);

-- Index for characters by story
CREATE INDEX IF NOT EXISTS idx_characters_story_id
ON characters(story_id);

-- Index for settings by story
CREATE INDEX IF NOT EXISTS idx_settings_story_id
ON settings(story_id);

-- Index for post count queries
CREATE INDEX IF NOT EXISTS idx_community_posts_story_deleted_status
ON community_posts(story_id, is_deleted, moderation_status);
```

**Run Migration:**
```bash
dotenv --file .env.local run pnpm db:migrate
```

**Index Benefits:**
- ✅ Converts full table scans to index scans
- ✅ Reduces query time from 100-500ms to 5-15ms
- ✅ Covers all WHERE clauses and ORDER BY clauses
- ✅ Supports pagination without performance degradation

## Cache Invalidation Strategy

### When to Invalidate

**Create Post:**
```typescript
// After successful post creation
await invalidateCache([
  `community:story:${storyId}:posts:public`,  // Posts list changed
  `community:story:${storyId}:public`,         // Post count changed
]);
```

**Delete Post:**
```typescript
// After successful post deletion
await invalidateCache([
  `community:story:${storyId}:posts:public`,
  `community:story:${storyId}:public`,
]);
```

**Update Post:**
```typescript
// After successful post update
await invalidateCache([
  `community:story:${storyId}:posts:public`,
]);
```

**Publish Story:**
```typescript
// When story visibility changes
await invalidateCache([
  `community:story:${storyId}:*`,  // All story caches
  `community:stories:all`,          // Story list cache
]);
```

## Performance Expectations

### Before Caching (Current State)

**First Load:**
- Client fetch: ~800-1500ms
- Database queries: 5-7 queries per page
- Total time: ~1000-2000ms

**Subsequent Loads:**
- Same as first load (no caching)
- Every navigation = full database hit

### After Caching (Expected)

**First Load (Cold Cache):**
- Client fetch: ~100-200ms (API route)
- Database queries: 3 queries (1 story, 1 posts, 1 characters/settings)
- Redis SET: ~50ms
- Total time: ~200-300ms

**Subsequent Loads (Warm SWR Cache):**
- Client fetch: ~1-5ms (SWR memory)
- Database queries: 0
- Total time: ~5-10ms

**Page Refresh (localStorage Cache):**
- Client fetch: ~10-20ms (localStorage)
- Database queries: 0
- Total time: ~20-30ms

**After 30 Minutes (Redis Cache):**
- Client fetch: ~30-50ms (Redis)
- Database queries: 0
- Total time: ~50-80ms

**Cache Hit Rates (Expected):**
- SWR memory: 70-80% of requests
- localStorage: 15-20% of requests
- Redis: 5-10% of requests
- Database: ``<5%`` of requests (cold start only)

**Performance Improvement:**
- ✅ 90-95% reduction in database queries
- ✅ 95-99% faster page loads after first visit
- ✅ 80-90% reduction in API response time
- ✅ Near-instant navigation between community pages

## Testing Plan

### 1. Performance Testing

**Measure Before:**
```bash
# Open DevTools Network tab
# Navigate to http://localhost:3000/community/story/[storyId]
# Record:
# - Time to Interactive (TTI)
# - Database query count (check server logs)
# - API response time
```

**Measure After:**
```bash
# First load (cold cache)
# - Should see ~200-300ms load time
# - Check X-Server-Timing header

# Second load (warm SWR cache)
# - Should see ~5-10ms load time
# - No API request (check Network tab - request should be cached)

# Refresh page (localStorage cache)
# - Should see ~20-30ms load time
# - Check localStorage in DevTools
```

### 2. Cache Invalidation Testing

**Test Post Creation:**
```bash
# 1. Load community page
# 2. Create a new post
# 3. Verify post appears immediately (cache invalidated)
# 4. Check Redis logs for invalidation
```

**Test Post Deletion:**
```bash
# 1. Delete a post
# 2. Verify post removed immediately
# 3. Verify post count updated
```

### 3. Cache Expiration Testing

**Test SWR Cache (30 minutes):**
```bash
# 1. Load page
# 2. Wait 31 minutes
# 3. Navigate to another page and back
# 4. Should see fresh data fetched (cache expired)
```

**Test localStorage (1 hour):**
```bash
# 1. Load page
# 2. Close browser
# 3. Reopen within 1 hour
# 4. Should see instant load from localStorage
# 5. Repeat after 61 minutes
# 6. Should fetch fresh data
```

## Monitoring

### Key Metrics to Track

**Cache Performance:**
- SWR hit rate: Should be >70%
- localStorage hit rate: Should be >15%
- Redis hit rate: Should be >5%
- Database hit rate: Should be ``<5%``

**API Performance:**
- Average response time: Should be ``<100ms``
- P95 response time: Should be ``<200ms``
- P99 response time: Should be ``<500ms``

**User Experience:**
- Time to Interactive: Should be ``<300ms``
- Time to First Byte: Should be ``<50ms``
- Navigation time: Should be ``<50ms`` (SWR cache)

### Logging

**Server Logs:**
```typescript
// Added by performance logger
[Cache] HIT community:story:${storyId}:public
[Cache] MISS community:story:${storyId}:public
[Cache] SET community:story:${storyId}:public (ttl: 3600s)
[Perf] getCommunityStory completed in 45ms (cached: true)
```

**Client Logs:**
```typescript
// Added by usePersistedSWR
[SWR] Cache HIT: /api/community/stories/${storyId} (memory)
[localStorage] Cache HIT: /api/community/stories/${storyId}
[localStorage] Cache SET: /api/community/stories/${storyId} (ttl: 60min)
```

## Migration Checklist

- [ ] Update `CACHE_CONFIGS.community` TTL to 30 minutes
- [ ] Create `use-community-cache.ts` with custom hooks
- [ ] Add `getCommunityStory()` to `cached-queries.ts`
- [ ] Add `getCommunityPosts()` to `cached-queries.ts`
- [ ] Add `getCommunityStory()` to `queries.ts`
- [ ] Add `getCommunityPosts()` to `queries.ts`
- [ ] Update `/api/community/stories/[storyId]/route.ts` to use cached queries
- [ ] Update `/api/community/stories/[storyId]/posts/route.ts` to use cached queries
- [ ] Update `/community/story/[storyId]/page.tsx` to use custom hooks
- [ ] Create database migration `0032_add_community_indexes.sql`
- [ ] Run database migration
- [ ] Test performance before and after
- [ ] Verify cache invalidation on mutations
- [ ] Monitor cache hit rates for 24 hours
- [ ] Update documentation with results

## Related Documentation

- **[docs/caching-strategy.md](./caching-strategy.md)** - Overall caching architecture
- **[docs/database-optimization-strategy.md](./database-optimization-strategy.md)** - Database indexing guide
- **[docs/community-specification.md](./community-specification.md)** - Community features spec

## Summary

**Expected Outcomes:**
- ✅ 90-95% reduction in database load
- ✅ 95-99% faster page loads after first visit
- ✅ ``<100ms`` API response time (from ~800ms)
- ✅ ``<10ms`` page navigation (SWR cache)
- ✅ Survives page refresh (localStorage)
- ✅ Better user experience with instant navigation
- ✅ Reduced server costs from fewer database queries

**Implementation Time:** ~2-3 hours
**Files to Create:** 2 new files
**Files to Modify:** 5 existing files
**Database Migration:** 1 migration with 4 indexes
**Lines of Code:** ~300-400 lines

---

**Next Steps:** Follow the implementation plan step-by-step, testing after each major change to ensure caching works correctly.

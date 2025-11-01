---
title: "Community Story Page Performance Fix"
---

# Community Story Page Performance Fix

**Date**: 2025-10-26
**Issue**: `/community/story/{storyId}` returned 500 error with 1466ms load time
**Status**: ✅ FIXED

## Root Cause Analysis

### Primary Issue
**ReferenceError**: `characters is not defined` in `src/lib/db/queries.ts:997`

The `getCommunityStory` function was attempting to query the `characters` and `settings` tables, but these table schemas were not imported in the queries file.

### Secondary Issue
**ReferenceError**: `storyId is not defined` in error logging code

The `storyId` variable was scoped inside the try block but referenced in the catch block for error logging.

## Fixes Applied

### 1. Fixed Missing Table Imports ✅

**File**: `src/lib/db/queries.ts:2`

**Before**:
```typescript
import { stories, chapters, users, userStats, parts, scenes, apiKeys, communityPosts } from './schema';
```

**After**:
```typescript
import { stories, chapters, users, userStats, parts, scenes, apiKeys, communityPosts, characters, settings } from './schema';
```

### 2. Fixed Error Logging Scope ✅

**File**: `src/app/api/community/stories/[storyId]/route.ts:14-23`

**Before**:
```typescript
export async function GET(...) {
  try {
    const { storyId } = await params;
    // ...
  } catch (error) {
    console.error({ storyId }); // ❌ storyId out of scope
  }
}
```

**After**:
```typescript
export async function GET(...) {
  let storyId: string | undefined;

  try {
    ({ storyId } = await params);
    // ...
  } catch (error) {
    console.error({ storyId }); // ✅ storyId in scope
  }
}
```

## Performance Analysis

### Current Performance (After Fix)

**API Response Time**: 3.7 seconds (cold cache)
**Database Query Time**: 2108ms

Query breakdown:
- Story query: 895ms
- Post count query: 162ms
- Characters query: 158ms (5 characters)
- Settings query: 893ms (4 settings)

### Performance Bottlenecks

1. **Settings Query**: 893ms - Fetching large JSON fields (sensory data, arrays)
2. **Story Query**: 895ms - Join with users table + large JSON fields
3. **No Redis Cache Hit**: Cold start, first request

### Expected Performance with Cache

With Redis cache hit (1-hour TTL):
- **Cached response**: 30-50ms (Redis lookup)
- **Cache hit rate**: >95% for published stories
- **Subsequent requests**: ~100ms total

## Database Indexes Status

All required indexes are already in place from previous migrations:

✅ **Migration 0024**: Performance indexes
- `idx_characters_story_id` on `characters(story_id)`

✅ **Migration 0032**: Community indexes
- `idx_characters_story_id` on `characters(story_id)` WHERE story_id IS NOT NULL
- `idx_settings_story_id` on `settings(story_id)` WHERE story_id IS NOT NULL
- `idx_community_posts_story_active_pinned` (composite index)
- `idx_community_posts_story_deleted_status`

## Performance Monitoring

### Already Implemented ✅

The `getCommunityStory` function includes comprehensive performance logging:

```typescript
console.log(`[getCommunityStory] 🔄 START DB queries for ${storyId}`);
console.log(`[getCommunityStory] ✅ Story query: ${elapsed}ms`);
console.log(`[getCommunityStory] ✅ Post count query: ${elapsed}ms`);
console.log(`[getCommunityStory] ✅ Characters query: ${elapsed}ms (${count} characters)`);
console.log(`[getCommunityStory] ✅ Settings query: ${elapsed}ms (${count} settings)`);
console.log(`[getCommunityStory] ✨ COMPLETE - Total DB time: ${totalTime}ms`);
```

### Performance Logger Integration

The API route uses the performance logger for request tracking:

```typescript
const perfLogger = getPerformanceLogger();
const operationId = `get-community-story-${Date.now()}`;

perfLogger.start(operationId, 'GET /api/community/stories/[storyId]', {
  apiRoute: true,
  storyId
});

// ... operation ...

perfLogger.end(operationId, {
  cached: true,
  storyId,
  success: true
});
```

## Testing Results

### Before Fix
- ❌ HTTP Status: 500 Internal Server Error
- ❌ Response Time: 1466ms (timeout)
- ❌ Error: `ReferenceError: characters is not defined`

### After Fix
- ✅ HTTP Status: 200 OK
- ✅ Response Time: 3.7s (cold cache), ~100ms (warm cache expected)
- ✅ Returns complete story data with:
  - Story metadata
  - 5 characters with full details
  - 4 settings with full sensory data
  - Community stats

## Recommendations for Future Optimization

### 1. Query Optimization (Optional)
Combine Story + Characters + Settings into a single query with LEFT JOINS to reduce round trips:

```typescript
const result = await db
  .select({
    story: stories,
    character: characters,
    setting: settings,
    author: users
  })
  .from(stories)
  .leftJoin(users, eq(stories.authorId, users.id))
  .leftJoin(characters, eq(characters.storyId, stories.id))
  .leftJoin(settings, eq(settings.storyId, stories.id))
  .where(eq(stories.id, storyId));
```

**Expected improvement**: 2108ms → ~800ms (62% faster)

### 2. Selective Field Loading
Only fetch required fields instead of all JSON data:

```typescript
.select({
  id: characters.id,
  name: characters.name,
  imageUrl: characters.imageUrl,
  // Skip large JSON fields like backstory, personality for list views
})
```

**Expected improvement**: 893ms → ~200ms for settings query

### 3. Pagination for Characters/Settings
For stories with many characters/settings (>10), implement pagination:

```typescript
.limit(10) // First 10 characters
```

## Files Modified

1. ✅ `src/lib/db/queries.ts` - Added missing imports
2. ✅ `src/app/api/community/stories/[storyId]/route.ts` - Fixed error logging scope

## Verification

Test the fixed endpoint:

```bash
curl http://localhost:3000/api/community/stories/3JpLdcXb5hQK7zy5g3QIj

# Expected:
# - HTTP 200 OK
# - JSON with story, characters, settings
# - Response time: 3-4s (cold), ~100ms (cached)
```

## Impact

- ✅ Community story pages now load correctly
- ✅ Full story data including characters and settings
- ✅ Comprehensive error logging for debugging
- ✅ Performance monitoring in place
- ⚠️  Performance could be further optimized with query consolidation

## Related Documentation

- Database indexes: `/drizzle/0032_add_community_indexes.sql`
- Caching strategy: `/docs/caching-strategy.md`
- Database optimization: `/docs/database-optimization-strategy.md`

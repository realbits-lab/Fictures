---
title: "Cache Invalidation Audit Report"
date: "November 2, 2025"
---

# Cache Invalidation Audit Report

**Audit Date:** November 2, 2025
**Routes Analyzed:** /studio, /novels, /comics, /community
**Status:** ⚠️ **CRITICAL GAPS FOUND**

---

## 🔍 Executive Summary

**Finding:** The Fictures platform has a **sophisticated 3-layer caching infrastructure** (Redis, localStorage, SWR) but cache invalidation is **INCOMPLETE AND INCONSISTENT** across routes.

### Critical Issues Identified

| Issue | Severity | Impact |
|-------|----------|--------|
| Client-side cache (localStorage) NOT invalidated on mutations | 🔴 **CRITICAL** | Users see stale data after editing |
| SWR cache NOT invalidated on mutations | 🔴 **CRITICAL** | In-memory cache serves outdated data |
| Invalidation hooks defined but NOT used | 🟡 **MEDIUM** | Dead code, infrastructure not utilized |
| Inconsistent Redis cache invalidation | 🟡 **MEDIUM** | Some endpoints invalidate, others don't |

---

## 📋 Caching Infrastructure Analysis

### Layer 1: SWR Memory Cache (Client-Side)

**Implementation:** `src/lib/hooks/use-persisted-swr.ts`

**Features:**
- TTL: 30 minutes (writing), 60 minutes (reading/community)
- Automatic caching on successful fetches
- ✅ Infrastructure EXISTS

**Cache Invalidation Status:**
```typescript
// File: src/lib/hooks/use-persisted-swr.ts
// Line 6: import { mutate } from 'swr'

// ❌ PROBLEM: mutate() is imported but NEVER CALLED after mutations
```

**Finding:** ❌ **SWR cache is NEVER invalidated after data updates**

### Layer 2: localStorage Cache (Client-Side)

**Implementation:** `src/lib/hooks/use-persisted-swr.ts` (CacheManager class)

**Features:**
- TTL-based expiration
- Version-based invalidation
- Size management (5MB limit)
- Automatic cleanup

**Cache Invalidation Methods:**
```typescript
// Available methods:
cacheManager.invalidatePageCache(pageType)  // Mark as stale
cacheManager.clearPageCache(pageType)       // Remove entirely
cacheManager.clearCachedData(key)           // Remove specific entry
```

**Usage Analysis:**
```bash
Files calling invalidation:
- src/lib/hooks/use-comments.ts (comments only)
- src/components/browse/BrowseClient.tsx (browse only)
- src/components/cache/CacheManagerWidget.tsx (manual widget)
```

**Finding:** ❌ **localStorage cache is NOT invalidated in ANY mutation endpoints**

### Layer 3: Redis Cache (Server-Side)

**Implementation:** `src/lib/cache/redis-cache.ts`

**Features:**
- TTL: 30 minutes (published), 3 minutes (drafts)
- Pattern-based deletion
- Automatic fallback to in-memory cache

**Cache Invalidation:**
```typescript
// Function: invalidateCache(keys)
// Usage: Only in src/lib/db/cached-queries.ts

// Example from updateChapter():
await invalidateCache([
  `chapter:${chapterId}:*`,
  `story:${chapter.storyId}:*`,
  `user:${userId}:stories*`,
  `stories:published`,
  `community:stories:all`,
]);
```

**Finding:** ✅ **Redis cache IS invalidated, but only for operations using cached-queries.ts**

---

## 🚨 Route-by-Route Analysis

### /studio (Writing/Editing)

**Caching Status:**
- ✅ Redis cache: PARTIAL invalidation (via cached-queries.ts)
- ❌ localStorage cache: NO invalidation
- ❌ SWR cache: NO invalidation

**Mutation Endpoints Checked:**
1. `PATCH /studio/api/scenes/[id]` ❌ No client cache invalidation
2. `PATCH /studio/api/chapters/[id]` ✅ Redis only (via updateChapter)
3. `PATCH /studio/api/stories/[id]/write` ❌ No client cache invalidation
4. `PATCH /studio/api/parts/[id]/write` ❌ No client cache invalidation

**Example Problem:**
```typescript
// File: src/app/studio/api/scenes/[id]/route.ts
// Line 106-112: Updates scene in database

const [updatedScene] = await db.update(scenes)
  .set({
    ...validatedData,
    updatedAt: new Date(),
  })
  .where(eq(scenes.id, id))
  .returning();

// ❌ MISSING: onSceneMutation(id, chapter.storyId)
// ❌ MISSING: mutate() for SWR cache
// ❌ MISSING: cacheManager.invalidatePageCache('writing')

return NextResponse.json({ scene: updatedScene });
```

**Impact:**
- User edits scene in /studio
- Database updated ✅
- Redis cache invalidated ❌ (not using cached-queries)
- localStorage still has old data ❌
- SWR cache still has old data ❌
- **User refreshes → sees OLD content from localStorage/SWR**

### /novels (Reading)

**Caching Status:**
- ✅ Redis cache: Working (read-only, TTL-based)
- ⚠️ localStorage cache: Works but never cleared
- ⚠️ SWR cache: Works but never cleared

**Analysis:**
```typescript
// File: src/app/novels/[id]/page.tsx
// Uses getStoryWithStructure() which has Redis caching

// Reading is mostly safe because:
// 1. Content doesn't change often (published stories)
// 2. TTL of 60 minutes will eventually refresh
```

**Finding:** 🟡 **MEDIUM RISK** - Stale cache could show outdated content for up to 60 minutes after author updates

### /comics (Reading)

**Caching Status:**
- Similar to /novels
- Same TTL and caching patterns

**Finding:** 🟡 **MEDIUM RISK** - Same issues as /novels

### /community (Sharing)

**Caching Status:**
- ✅ Redis cache: Partially working
- ❌ localStorage cache: NO invalidation
- ❌ SWR cache: NO invalidation

**Analysis:**
```bash
Community endpoints checked:
- GET /community/api/stories - Uses caching
- POST /community/api/posts - ❌ No cache invalidation
- POST /community/api/likes - ❌ No cache invalidation
```

**Impact:**
- User likes a post → Database updated
- Community feed cache not cleared
- **User sees old like count until cache expires (30 minutes)**

---

## 🛠️ Unused Cache Infrastructure

### Invalidation Hooks (NOT USED!)

**File:** `src/lib/cache/invalidation-hooks.ts`

**Defined Functions:**
```typescript
onStoryMutation(storyId)           // ❌ Never called
onPartMutation(partId, storyId)    // ❌ Never called
onChapterMutation(chapterId, storyId)  // ❌ Never called
onSceneMutation(sceneId, storyId)  // ❌ Never called
onCharacterMutation(characterId, storyId)  // ❌ Never called
onSettingMutation(settingId, storyId)  // ❌ Never called
```

**Status:** 💀 **DEAD CODE** - These hooks exist but are never imported or used in any API routes

---

## 📊 Cache Invalidation Coverage

### Current Coverage

| Operation | Redis | localStorage | SWR | Overall |
|-----------|-------|--------------|-----|---------|
| **Studio - Scene Update** | ❌ | ❌ | ❌ | 0% |
| **Studio - Chapter Update** | ✅ | ❌ | ❌ | 33% |
| **Studio - Story Update** | ❌ | ❌ | ❌ | 0% |
| **Studio - Part Update** | ❌ | ❌ | ❌ | 0% |
| **Community - Like/Comment** | ⚠️ | ❌ | ❌ | ~10% |
| **Novels - Reading** | ✅ | N/A | N/A | Read-only |
| **Comics - Reading** | ✅ | N/A | N/A | Read-only |

**Average Coverage:** ~15% (Critical operations only 10-33% covered)

---

## 💥 Real-World Impact Scenarios

### Scenario 1: Scene Editing

**User Action:**
1. Writer opens /studio/edit/story/ABC
2. Edits scene content
3. Clicks "Save" → PATCH /studio/api/scenes/[id]
4. Database updated ✅
5. Page shows "Saved" message ✅

**Problem:**
6. Writer refreshes page
7. localStorage cache loads OLD content ❌
8. SWR cache shows OLD content ❌
9. **Writer sees their edits disappeared!**

**Duration:** Until localStorage TTL expires (30 minutes) or manual cache clear

### Scenario 2: Community Engagement

**User Action:**
1. Reader visits /community
2. Likes a story → POST /community/api/likes
3. Database updated ✅
4. UI shows "Liked" ✅

**Problem:**
5. Reader navigates away and back
6. localStorage cache loads OLD data ❌
7. **Story shows as "Not Liked"** ❌
8. Like count is wrong ❌

**Duration:** Until cache expires (30 minutes)

### Scenario 3: Publishing a Story

**User Action:**
1. Writer publishes story in /studio
2. Story status changes to "published" ✅
3. Database updated ✅
4. Redis cache invalidated ✅

**Problem:**
5. Writer visits /novels to view published story
6. localStorage cache shows "writing" status ❌
7. **Story doesn't appear in published list** ❌

**Duration:** Until localStorage expires (60 minutes)

---

## ✅ Recommended Fixes

### Priority 1: Studio Mutations (CRITICAL)

**Action Required:** Add cache invalidation to ALL mutation endpoints

**Example Fix for Scene Update:**
```typescript
// File: src/app/studio/api/scenes/[id]/route.ts

export async function PATCH(request, { params }) {
  // ... existing validation ...

  // Update scene
  const [updatedScene] = await db.update(scenes)
    .set({ ...validatedData, updatedAt: new Date() })
    .where(eq(scenes.id, id))
    .returning();

  // ✅ ADD: Server-side cache invalidation
  const { onSceneMutation } = await import('@/lib/cache/invalidation-hooks');
  await onSceneMutation(id, chapter.storyId);

  // ✅ ADD: Return cache invalidation headers for client
  return NextResponse.json(
    { scene: updatedScene },
    {
      headers: {
        'X-Cache-Invalidate': `writing,story:${chapter.storyId}`,
      },
    }
  );
}
```

**Client-side handler:**
```typescript
// File: src/components/studio/UnifiedWritingEditor.tsx

const handleSave = async () => {
  const response = await fetch(`/studio/api/scenes/${sceneId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  // ✅ ADD: Invalidate client caches
  const invalidateHeader = response.headers.get('X-Cache-Invalidate');
  if (invalidateHeader) {
    const caches = invalidateHeader.split(',');
    caches.forEach(cache => {
      cacheManager.invalidatePageCache(cache);
    });
  }

  // ✅ ADD: Invalidate SWR cache
  mutate(`/studio/api/stories/${storyId}`);
  mutate(`/studio/api/chapters/${chapterId}`);
  mutate(`/studio/api/scenes/${sceneId}`);
};
```

### Priority 2: Community Mutations (HIGH)

**Endpoints to Fix:**
- POST /community/api/likes
- POST /community/api/comments
- DELETE /community/api/posts/[id]

**Pattern:**
```typescript
// After successful mutation:
await invalidateCache([
  `community:stories:all`,
  `community:post:${postId}`,
  `story:${storyId}:community`,
]);

// Return header:
headers: { 'X-Cache-Invalidate': 'community' }
```

### Priority 3: Activate Invalidation Hooks (MEDIUM)

**Action:** Use the existing invalidation-hooks.ts functions

**Replace direct DB updates with:**
```typescript
// ❌ OLD:
await db.update(chapters).set({...}).where(eq(chapters.id, id));

// ✅ NEW:
await db.update(chapters).set({...}).where(eq(chapters.id, id));
await onChapterMutation(id, storyId);  // Invalidates all caches
```

### Priority 4: Client-Side Cache Middleware (RECOMMENDED)

**Create:** `src/lib/cache/cache-middleware.ts`

```typescript
export function withCacheInvalidation(handler: Function) {
  return async (...args: any[]) => {
    const result = await handler(...args);

    // Auto-detect mutation type
    if (args[0]?.method && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(args[0].method)) {
      const url = args[0].url;

      // Auto-invalidate based on URL pattern
      if (url.includes('/studio/')) {
        cacheManager.invalidatePageCache('writing');
      }
      if (url.includes('/community/')) {
        cacheManager.invalidatePageCache('community');
      }
      // ... etc
    }

    return result;
  };
}
```

---

## 🎯 Implementation Roadmap

### Week 1: Critical Fixes
- [ ] Add cache invalidation to ALL /studio mutation endpoints
- [ ] Add SWR mutate() calls in UnifiedWritingEditor
- [ ] Add localStorage invalidation via cacheManager

### Week 2: Community & Reading
- [ ] Fix community mutations (likes, comments, posts)
- [ ] Add cache headers to all mutation responses
- [ ] Update client-side handlers to read headers

### Week 3: Infrastructure Improvements
- [ ] Activate invalidation-hooks.ts functions
- [ ] Create cache middleware for automatic invalidation
- [ ] Add cache invalidation tests

### Week 4: Monitoring & Validation
- [ ] Add cache hit/miss metrics
- [ ] Add cache invalidation logging
- [ ] Create cache debugging tools
- [ ] Document cache invalidation patterns

---

## 📈 Success Metrics

**Current State:**
- Cache invalidation coverage: ~15%
- User-reported stale data issues: Unknown
- Cache effectiveness: Unknown

**Target State:**
- Cache invalidation coverage: 100%
- User-reported stale data issues: 0
- Cache hit rate: 80%+
- Average response time: <50ms (cached), <600ms (uncached)

---

## 🔗 Related Files

### Cache Infrastructure
- `src/lib/cache/redis-cache.ts` - Redis caching
- `src/lib/cache/story-structure-cache.ts` - Story-specific caching
- `src/lib/cache/invalidation-hooks.ts` - Invalidation hooks (UNUSED)
- `src/lib/hooks/use-persisted-swr.ts` - Client-side caching

### Key Mutation Endpoints
- `src/app/studio/api/scenes/[id]/route.ts` - Scene updates
- `src/app/studio/api/chapters/[id]/route.ts` - Chapter updates
- `src/app/studio/api/stories/[id]/write/route.ts` - Story updates
- `src/app/community/api/likes/route.ts` - Community interactions

### Database Queries
- `src/lib/db/cached-queries.ts` - Queries with cache invalidation
- `src/lib/db/queries.ts` - Raw queries (no caching)

---

## 🏁 Conclusion

**Status:** ⚠️ **IMMEDIATE ACTION REQUIRED**

The Fictures platform has excellent caching infrastructure but **critical gaps in cache invalidation**. Users are experiencing stale data because:

1. ❌ Client-side caches (localStorage, SWR) are NEVER invalidated
2. ❌ Most mutation endpoints don't invalidate Redis cache
3. ❌ Existing invalidation hooks are dead code (never used)

**Recommendation:** Implement Priority 1 fixes immediately to prevent data consistency issues.

---

*Audit performed by: Claude Code*
*Date: November 2, 2025*
*Version: 1.0.0*

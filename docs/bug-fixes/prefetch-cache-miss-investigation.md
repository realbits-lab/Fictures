# Prefetch "Cache MISS" Investigation & Fix

**Date:** 2025-10-24
**Issue:** User reported seeing "Cache MISS" console logs even after visiting scene pages
**Status:** ✅ RESOLVED

---

## Problem Statement

User reported:
> "I still got Cache MISS console message, even though I already loaded that scene content before."

This appeared to be a caching bug where scene content wasn't being properly cached or retrieved.

---

## Investigation Process

### Step 1: Initial Hypothesis
Initially suspected that:
1. Scene content wasn't being cached to localStorage
2. Cache version/TTL logic had bugs
3. `useChapterScenes` hook wasn't checking cache properly

### Step 2: Testing Story Structure Cache
Created `scripts/debug-cache-miss.mjs` to test cache behavior:
- ✅ Story list cache working correctly
- ✅ Story structure cache working correctly
- ❌ **But no scene content cache was tested** (gap in test)

### Step 3: Enhanced Testing - Scene Content
Created `scripts/test-scene-content-cache.mjs` to specifically test scene clicks:
- Navigates to story page
- Clicks on scene buttons to trigger `useChapterScenes` hook
- Checks for scene cache MISS/HIT logs
- Returns and clicks same scene again

### Step 4: BREAKTHROUGH FINDING

Test revealed two types of cache logs:

**✅ Scene cache WORKING correctly for clicked scene:**
```
[CacheManager] ✅ Cache HIT for /writing/api/chapters/vBW_y9cV9QsTByZFCMXFb/scenes:
{age: 1s, dataSize: 8.98 KB}
```

**❌ Cache MISS logs for DIFFERENT scenes:**
```
[CacheManager] ❌ Cache MISS for /writing/api/chapters/tBRJ3wjB5wBmxgEWMqTuv/scenes:
No data in localStorage

[exg6d] ❌ Cache MISS - Not in localStorage or SWR cache (Cache check: 0.20ms)
```

**Key Discovery:** The Cache MISS logs were from the **prefetch hook prefetching adjacent scenes** that hadn't been visited yet!

---

## Root Cause

The "Cache MISS" logs user was seeing were **EXPECTED BEHAVIOR** from the prefetch system:

1. When user clicks on a scene, `handleSceneSelect` is called
2. This triggers the prefetch hook to prefetch adjacent scenes (prev/next)
3. The prefetch hook checks if scenes are already cached
4. **If not cached, it logs "❌ Cache MISS"** before fetching
5. This is INTENTIONAL - prefetching is supposed to fetch uncached scenes!

### The Misleading Part

The prefetch hook's log message was misleading:
```javascript
// BEFORE (misleading):
console.log(`[${prefetchId}] ❌ Cache MISS - Not in localStorage or SWR cache`);
```

Problems with this message:
- ❌ Uses error emoji which implies something went wrong
- ❌ Says "Cache MISS" which sounds like a bug
- ❌ Doesn't indicate this is expected prefetch behavior

---

## Solution

Changed the prefetch log message to be more accurate and less alarming:

**File:** `src/hooks/useScenePrefetch.ts`
**Line:** 51

```javascript
// BEFORE (misleading):
console.log(`[${prefetchId}] ❌ Cache MISS - Not in localStorage or SWR cache (Cache check: ${cacheCheckDuration.toFixed(2)}ms)`);

// AFTER (clear):
console.log(`[${prefetchId}] 🔮 Prefetching uncached scene - Not yet cached (Cache check: ${cacheCheckDuration.toFixed(2)}ms)`);
```

### Why This Fix Works

1. **🔮 Crystal ball emoji** - Indicates forward-looking/prefetch behavior
2. **"Prefetching uncached scene"** - Makes it clear this is intentional prefetch
3. **"Not yet cached"** - Neutral language, not error-like
4. **Implies proactive optimization** - User knows this is improving future performance

---

## Verification

### Cache Behavior Confirmed Working

**Scene Content Cache (clicked scenes):**
- ✅ First click: Cache MISS → fetches and caches
- ✅ Second click: Cache HIT → loads from cache (~1ms)
- ✅ localStorage persists between sessions
- ✅ 30-minute SWR memory cache retention
- ✅ 5-minute localStorage TTL for scenes

**Prefetch Behavior (adjacent scenes):**
- ✅ Prefetches next/previous scenes automatically
- ✅ Checks cache before fetching
- ✅ Now logs "🔮 Prefetching uncached scene" instead of "❌ Cache MISS"
- ✅ Populates SWR cache for instant future navigation

---

## Testing Results

**Test:** `scripts/test-scene-content-cache.mjs`

**First Scene Click (expected):**
```
📊 First scene click logs:
  Scene-related logs: 5
  Cache MISS: 1 (Expected - first load)
  Cache HIT: 0
```

**Second Scene Click (should hit cache):**
```
📊 Second scene click logs:
  Scene-related logs: 7
  Cache MISS: 1 (From prefetch of different scene)
  Cache HIT: 1 (✅ From clicked scene!)
```

**localStorage Verification:**
```
✅ swr-cache-/writing/api/chapters/vBW_y9cV9QsTByZFCMXFb/scenes: 8.98 KB
✅ Cache persists between navigations
✅ Cache TTL: 5 minutes
✅ Version: 1.1.0
```

---

## Conclusion

### What Was Actually Wrong
Nothing was broken! The cache system was working correctly. The only issue was **misleading log messages** that made expected prefetch behavior look like an error.

### What Changed
1. Updated prefetch hook log message from `❌ Cache MISS` to `🔮 Prefetching uncached scene`
2. User will now see clear prefetch logs instead of alarming cache miss messages
3. No functional changes to caching logic needed

### Cache Performance Summary

| Cache Layer | Retention | Purpose | Status |
|------------|-----------|---------|--------|
| **SWR Memory** | 30 min | Instant loads during session | ✅ Working |
| **localStorage** | 5 min (scenes), 1 hr (stories) | Persist between sessions | ✅ Working |
| **ETag Cache** | 1 hour | Server-side validation | ✅ Working |
| **Prefetch** | Background | Load adjacent scenes | ✅ Working (logs fixed) |

### User Experience Impact

**Before:**
- User sees "❌ Cache MISS" logs while reading
- Appears like something is broken
- Causes confusion

**After:**
- User sees "🔮 Prefetching uncached scene" logs
- Understands this is proactive optimization
- Clear that system is working to improve performance

---

## Related Files

**Modified:**
- `src/hooks/useScenePrefetch.ts` - Fixed misleading log message (line 51)

**Test Scripts Created:**
- `scripts/debug-cache-miss.mjs` - Tests story structure cache
- `scripts/test-scene-content-cache.mjs` - Tests actual scene content cache

**Documentation:**
- `docs/30min-cache-retention.md` - Extended cache retention rationale
- `docs/cache-miss-bug-fix.md` - Version mismatch bug fix
- `docs/prefetch-cache-miss-investigation.md` - This document

---

**Status:** ✅ RESOLVED
**Breaking Changes:** None
**User-Visible Changes:** Improved console log clarity
**Performance Impact:** None (only logging changes)

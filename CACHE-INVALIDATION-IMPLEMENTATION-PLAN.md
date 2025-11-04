---
title: "Cache Invalidation Implementation Plan"
date: "November 2, 2025"
version: "1.0.0"
---

# Cache Invalidation Implementation Plan
## 4-Week Comprehensive Rollout

**Status:** 📋 Ready for Implementation
**Timeline:** 4 weeks (20 working days)
**Risk Level:** 🟡 Medium (with mitigation strategies)
**Impact:** 🔴 Critical (fixes major data consistency issues)

---

## 📐 Architecture Overview

### Current State (Broken)
```
[User Action] → [API Mutation] → [Database] ✅
                                  ↓
                            [Redis Cache] ❌ Sometimes invalidated
                                  ↓
                          [localStorage] ❌ NEVER invalidated
                                  ↓
                              [SWR Cache] ❌ NEVER invalidated
                                  ↓
                            [User sees STALE data] 💥
```

### Target State (Fixed)
```
[User Action] → [API Mutation] → [Database] ✅
                                  ↓
                     [Unified Invalidation Layer] ✅
                           ↓         ↓         ↓
                      [Redis]  [localStorage]  [SWR]
                         ✅         ✅         ✅
                                  ↓
                        [User sees FRESH data] ✅
```

---

## 🏗️ Week 1: Foundation & Critical Studio Fixes

**Goal:** Fix Studio mutations so writers don't lose edits
**Success Metric:** 100% cache invalidation coverage for /studio routes

### Day 1-2: Foundation Infrastructure

#### 1.1 Create Unified Invalidation Utility

**File:** `src/lib/cache/unified-invalidation.ts`

```typescript
/**
 * Unified Cache Invalidation
 *
 * Central system for invalidating all cache layers:
 * - Layer 3: Redis (server-side)
 * - Layer 2: localStorage (client-side via headers)
 * - Layer 1: SWR (client-side via headers)
 */

import { invalidateCache as invalidateRedis } from './redis-cache';
import {
  onStoryMutation,
  onPartMutation,
  onChapterMutation,
  onSceneMutation,
  onCharacterMutation,
  onSettingMutation
} from './invalidation-hooks';

// Cache invalidation patterns for different entity types
export const CACHE_PATTERNS = {
  story: (storyId: string) => [
    `story:${storyId}:*`,
    `user:*:stories*`,
    `stories:published`,
    `community:stories:all`,
  ],
  part: (partId: string, storyId: string) => [
    `part:${partId}:*`,
    `story:${storyId}:*`,
  ],
  chapter: (chapterId: string, storyId: string) => [
    `chapter:${chapterId}:*`,
    `story:${storyId}:*`,
  ],
  scene: (sceneId: string, chapterId: string, storyId: string) => [
    `scene:${sceneId}:*`,
    `chapter:${chapterId}:*`,
    `story:${storyId}:*`,
  ],
  character: (characterId: string, storyId: string) => [
    `character:${characterId}:*`,
    `story:${storyId}:characters`,
  ],
  setting: (settingId: string, storyId: string) => [
    `setting:${settingId}:*`,
    `story:${storyId}:settings`,
  ],
} as const;

// Client-side cache types to invalidate
export type ClientCacheType = 'writing' | 'reading' | 'community' | 'publish' | 'analytics';

export interface InvalidationContext {
  entityType: 'story' | 'part' | 'chapter' | 'scene' | 'character' | 'setting';
  entityId: string;
  storyId: string;
  chapterId?: string; // For scenes
  clientCaches?: ClientCacheType[]; // Which client caches to invalidate
  specificKeys?: string[]; // Additional specific keys to invalidate
}

/**
 * Server-side: Invalidate all relevant caches for an entity
 */
export async function invalidateEntityCache(context: InvalidationContext): Promise<void> {
  console.log(`[UnifiedInvalidation] Invalidating cache for ${context.entityType} ${context.entityId}`);

  // 1. Call the appropriate invalidation hook (invalidates Redis + patterns)
  switch (context.entityType) {
    case 'story':
      await onStoryMutation(context.storyId);
      break;
    case 'part':
      await onPartMutation(context.entityId, context.storyId);
      break;
    case 'chapter':
      await onChapterMutation(context.entityId, context.storyId);
      break;
    case 'scene':
      await onSceneMutation(context.entityId, context.storyId);
      break;
    case 'character':
      await onCharacterMutation(context.entityId, context.storyId);
      break;
    case 'setting':
      await onSettingMutation(context.entityId, context.storyId);
      break;
  }

  // 2. Invalidate any additional specific keys
  if (context.specificKeys && context.specificKeys.length > 0) {
    await invalidateRedis(context.specificKeys);
  }

  console.log(`[UnifiedInvalidation] ✅ Server cache invalidated for ${context.entityType} ${context.entityId}`);
}

/**
 * Generate cache invalidation headers for client-side handling
 */
export function getCacheInvalidationHeaders(context: InvalidationContext): Record<string, string> {
  const headers: Record<string, string> = {};

  // Client cache types to invalidate (e.g., 'writing,reading')
  const clientCaches = context.clientCaches || ['writing'];
  headers['X-Cache-Invalidate'] = clientCaches.join(',');

  // Specific cache keys to invalidate (e.g., 'story:123,chapter:456')
  const specificKeys: string[] = [`${context.entityType}:${context.entityId}`];
  if (context.storyId) specificKeys.push(`story:${context.storyId}`);
  if (context.chapterId) specificKeys.push(`chapter:${context.chapterId}`);
  headers['X-Cache-Invalidate-Keys'] = specificKeys.join(',');

  // Timestamp for debugging
  headers['X-Cache-Invalidate-Timestamp'] = new Date().toISOString();

  return headers;
}

/**
 * Helper to extract invalidation context from common mutation patterns
 */
export function createInvalidationContext(params: {
  entityType: InvalidationContext['entityType'];
  entityId: string;
  storyId: string;
  chapterId?: string;
  includeReading?: boolean; // Also invalidate reading caches
  includeCommunity?: boolean; // Also invalidate community caches
}): InvalidationContext {
  const clientCaches: ClientCacheType[] = ['writing'];

  if (params.includeReading) clientCaches.push('reading');
  if (params.includeCommunity) clientCaches.push('community');

  return {
    entityType: params.entityType,
    entityId: params.entityId,
    storyId: params.storyId,
    chapterId: params.chapterId,
    clientCaches,
  };
}
```

#### 1.2 Create Client-Side Cache Invalidation Hook

**File:** `src/lib/hooks/use-cache-invalidation.ts`

```typescript
'use client';

import { useCallback } from 'react';
import { mutate } from 'swr';
import { cacheManager } from './use-persisted-swr';

export interface CacheInvalidationHeaders {
  'X-Cache-Invalidate'?: string; // Page types: 'writing,reading,community'
  'X-Cache-Invalidate-Keys'?: string; // Specific keys: 'story:123,chapter:456'
  'X-Cache-Invalidate-Timestamp'?: string;
}

/**
 * Hook for handling cache invalidation after mutations
 */
export function useCacheInvalidation() {
  /**
   * Process cache invalidation headers from API response
   */
  const handleCacheInvalidation = useCallback((headers: Headers | CacheInvalidationHeaders) => {
    const getHeader = (key: string): string | null => {
      if (headers instanceof Headers) {
        return headers.get(key);
      }
      return headers[key as keyof CacheInvalidationHeaders] || null;
    };

    // 1. Invalidate page-level caches (localStorage)
    const cacheTypes = getHeader('X-Cache-Invalidate');
    if (cacheTypes) {
      console.log('[CacheInvalidation] Invalidating page caches:', cacheTypes);
      cacheTypes.split(',').forEach(type => {
        cacheManager.invalidatePageCache(type.trim());
      });
    }

    // 2. Invalidate specific SWR keys
    const cacheKeys = getHeader('X-Cache-Invalidate-Keys');
    if (cacheKeys) {
      console.log('[CacheInvalidation] Invalidating SWR keys:', cacheKeys);
      const keys = cacheKeys.split(',').map(k => k.trim());

      keys.forEach(key => {
        // Invalidate exact matches
        mutate(
          (swrKey) => typeof swrKey === 'string' && swrKey.includes(key),
          undefined,
          { revalidate: true }
        );
      });
    }

    // 3. Log invalidation
    const timestamp = getHeader('X-Cache-Invalidate-Timestamp');
    console.log('[CacheInvalidation] ✅ Cache invalidated at', timestamp || new Date().toISOString());
  }, []);

  /**
   * Invalidate specific SWR keys manually
   */
  const invalidateSWRKeys = useCallback((keys: string[]) => {
    console.log('[CacheInvalidation] Manually invalidating SWR keys:', keys);
    keys.forEach(key => {
      mutate(key, undefined, { revalidate: true });
    });
  }, []);

  /**
   * Invalidate page cache manually
   */
  const invalidatePageCache = useCallback((pageType: string) => {
    console.log('[CacheInvalidation] Manually invalidating page cache:', pageType);
    cacheManager.invalidatePageCache(pageType);
  }, []);

  return {
    handleCacheInvalidation,
    invalidateSWRKeys,
    invalidatePageCache,
  };
}
```

### Day 3-4: Update Studio API Routes

**Pattern to follow for ALL Studio mutation endpoints:**

```typescript
// Example: src/app/studio/api/scenes/[id]/route.ts

import { invalidateEntityCache, getCacheInvalidationHeaders, createInvalidationContext } from '@/lib/cache/unified-invalidation';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sceneId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSceneSchema.parse(body);

    // Get scene and verify ownership
    const [existingScene] = await db.select().from(scenes).where(eq(scenes.id, sceneId));
    if (!existingScene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, existingScene.chapterId));
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const [story] = await db.select().from(stories).where(eq(stories.id, chapter.storyId));
    if (!story || story.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // ✅ STEP 1: Update scene in database
    const [updatedScene] = await db.update(scenes)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(scenes.id, sceneId))
      .returning();

    // ✅ STEP 2: Invalidate server-side caches (Redis)
    const invalidationContext = createInvalidationContext({
      entityType: 'scene',
      entityId: sceneId,
      storyId: story.id,
      chapterId: chapter.id,
      includeReading: story.status === 'published', // Also invalidate reading cache if published
    });

    await invalidateEntityCache(invalidationContext);

    // ✅ STEP 3: Return response with cache invalidation headers
    const headers = getCacheInvalidationHeaders(invalidationContext);

    return NextResponse.json(
      {
        scene: updatedScene,
        cacheInvalidated: true,
      },
      { headers }
    );

  } catch (error) {
    console.error('Error updating scene:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Files to update (Day 3-4):**

1. ✅ `src/app/studio/api/scenes/[id]/route.ts` - PATCH
2. ✅ `src/app/studio/api/chapters/[id]/route.ts` - PATCH
3. ✅ `src/app/studio/api/stories/[id]/write/route.ts` - PATCH
4. ✅ `src/app/studio/api/parts/[id]/write/route.ts` - PATCH
5. ✅ `src/app/studio/api/characters/[id]/route.ts` - PATCH, DELETE
6. ✅ `src/app/studio/api/settings/[id]/route.ts` - PATCH, DELETE

**Checklist for each file:**
- [ ] Import invalidation utilities
- [ ] Add invalidation after successful DB update
- [ ] Include cache headers in response
- [ ] Test manually
- [ ] Add unit test

### Day 5-6: Update Client-Side Components

#### 5.1 Update UnifiedWritingEditor

**File:** `src/components/studio/UnifiedWritingEditor.tsx`

```typescript
// Add at top of file
import { useCacheInvalidation } from '@/lib/hooks/use-cache-invalidation';

// Inside component
export function UnifiedWritingEditor({ story, initialSelection, disabled }: Props) {
  const { handleCacheInvalidation, invalidateSWRKeys } = useCacheInvalidation();

  // Update the handleSave function
  const handleSave = async () => {
    // ... existing validation ...

    try {
      setIsSaving(true);

      // Determine endpoint based on selection level
      let endpoint = '';
      let method = 'PATCH';
      let payload = {};

      if (currentSelection.level === 'scene') {
        endpoint = `/studio/api/scenes/${currentSelection.sceneId}`;
        payload = {
          title: formData.title,
          content: formData.content,
          goal: formData.goal,
          conflict: formData.conflict,
          outcome: formData.outcome,
        };
      } else if (currentSelection.level === 'chapter') {
        endpoint = `/studio/api/chapters/${currentSelection.chapterId}/write`;
        payload = {
          title: formData.title,
          hnsData: formData.hnsData,
        };
      } else if (currentSelection.level === 'story') {
        endpoint = `/studio/api/stories/${story.id}/write`;
        payload = {
          title: formData.title,
          hnsData: formData.hnsData,
        };
      } else if (currentSelection.level === 'part') {
        endpoint = `/studio/api/parts/${currentSelection.partId}/write`;
        payload = {
          title: formData.title,
          hnsData: formData.hnsData,
        };
      }

      // ✅ Make API call
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.statusText}`);
      }

      const result = await response.json();

      // ✅ NEW: Process cache invalidation headers
      handleCacheInvalidation(response.headers);

      // ✅ NEW: Also invalidate specific SWR keys for current story
      invalidateSWRKeys([
        `/studio/api/stories/${story.id}`,
        `/studio/api/stories/${story.id}/structure`,
      ]);

      // ✅ Show success message
      toast.success('Saved successfully');
      setIsSaving(false);

      // ✅ Refresh data (SWR will use fresh cache)
      // mutate will revalidate from server, getting fresh data
      // This is now fast because cache was cleared

    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save');
      setIsSaving(false);
    }
  };

  // Rest of component...
}
```

#### 5.2 Create Reusable Mutation Hook

**File:** `src/lib/hooks/use-mutation-with-cache.ts`

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useCacheInvalidation } from './use-cache-invalidation';

interface MutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<Response>;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  additionalSWRKeys?: string[]; // Additional keys to invalidate
}

/**
 * Hook for mutations with automatic cache invalidation
 * Similar to React Query's useMutation but with cache handling
 */
export function useMutationWithCache<TData = any, TVariables = any>(
  options: MutationOptions<TData, TVariables>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const { handleCacheInvalidation, invalidateSWRKeys } = useCacheInvalidation();

  const mutate = useCallback(async (variables: TVariables) => {
    setIsLoading(true);
    setError(null);

    try {
      // Execute mutation
      const response = await options.mutationFn(variables);

      if (!response.ok) {
        throw new Error(`Mutation failed: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);

      // Handle cache invalidation from headers
      handleCacheInvalidation(response.headers);

      // Invalidate additional SWR keys if provided
      if (options.additionalSWRKeys) {
        invalidateSWRKeys(options.additionalSWRKeys);
      }

      // Call onSuccess callback
      options.onSuccess?.(result);

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [options, handleCacheInvalidation, invalidateSWRKeys]);

  return {
    mutate,
    isLoading,
    error,
    data,
  };
}

// Usage example:
/*
const { mutate: updateScene, isLoading } = useMutationWithCache({
  mutationFn: async (data) => fetch(`/api/scenes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  onSuccess: () => toast.success('Saved!'),
  additionalSWRKeys: [`/api/stories/${storyId}`],
});

await updateScene({ title: 'New title', content: '...' });
*/
```

### Day 7: Testing & Validation

#### 7.1 Create Test Suite

**File:** `tests/cache-invalidation-studio.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Studio Cache Invalidation', () => {
  test.use({ storageState: '.auth/user.json' });

  test('scene edit invalidates all cache layers', async ({ page }) => {
    // 1. Navigate to studio
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // 2. Select a story
    const firstStory = page.locator('[data-testid="story-card"]').first();
    const storyId = await firstStory.getAttribute('data-story-id');
    await firstStory.click();

    // 3. Select a scene
    const firstScene = page.locator('[data-testid="scene-node"]').first();
    const sceneId = await firstScene.getAttribute('data-scene-id');
    await firstScene.click();

    // 4. Edit scene content
    const contentEditor = page.locator('[data-testid="scene-content-editor"]');
    const originalContent = await contentEditor.inputValue();
    const newContent = `${originalContent}\nTEST EDIT ${Date.now()}`;

    await contentEditor.fill(newContent);

    // 5. Save
    await page.click('[data-testid="save-button"]');
    await page.waitForSelector('text=Saved successfully');

    // 6. Check for cache invalidation headers in network
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/studio/api/scenes/')) {
        responses.push(response);
      }
    });

    // Wait for save response
    await page.waitForTimeout(1000);

    // Verify headers
    const saveResponse = responses.find(r => r.request().method() === 'PATCH');
    expect(saveResponse).toBeTruthy();

    const cacheInvalidateHeader = await saveResponse!.headerValue('X-Cache-Invalidate');
    expect(cacheInvalidateHeader).toContain('writing');

    // 7. Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 8. Navigate back to same scene
    await firstStory.click();
    await firstScene.click();

    // 9. Verify content is fresh (not from stale cache)
    const refreshedContent = await contentEditor.inputValue();
    expect(refreshedContent).toBe(newContent);
    expect(refreshedContent).toContain('TEST EDIT');
  });

  test('chapter edit invalidates cache', async ({ page }) => {
    // Similar test for chapter editing
  });

  test('story edit invalidates cache', async ({ page }) => {
    // Similar test for story editing
  });

  test('localStorage cache is cleared after mutation', async ({ page }) => {
    // 1. Load story (populates localStorage)
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // 2. Check localStorage has cache
    const cacheKeys = await page.evaluate(() => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('swr-cache-')) {
          keys.push(key);
        }
      }
      return keys;
    });
    expect(cacheKeys.length).toBeGreaterThan(0);

    // 3. Make mutation
    // ... edit scene ...

    // 4. Check cache timestamp is reset
    const timestamp = await page.evaluate((key) => {
      return localStorage.getItem(`${key}-timestamp`);
    }, cacheKeys[0]);

    expect(timestamp).toBe('0'); // Should be marked as stale
  });
});
```

#### 7.2 Manual Testing Checklist

**Test each Studio mutation:**

- [ ] Edit Scene → Save → Refresh → Content is fresh ✅
- [ ] Edit Chapter → Save → Refresh → Content is fresh ✅
- [ ] Edit Story → Save → Refresh → Content is fresh ✅
- [ ] Edit Part → Save → Refresh → Content is fresh ✅
- [ ] Delete Character → Refresh → Character gone ✅
- [ ] Add Setting → Refresh → Setting appears ✅

**Verify cache invalidation:**

- [ ] Console shows cache invalidation logs ✅
- [ ] Network tab shows X-Cache-Invalidate headers ✅
- [ ] localStorage timestamp is reset ✅
- [ ] SWR cache is revalidated ✅
- [ ] Redis cache patterns are deleted ✅

---

## 🌐 Week 2: Community & Reading Routes

**Goal:** Fix community interactions and reading caches
**Success Metric:** Community actions (likes, comments) reflect immediately

### Day 8-9: Community Mutations

**Files to update:**

1. `src/app/community/api/likes/route.ts` (POST, DELETE)
2. `src/app/community/api/comments/route.ts` (POST)
3. `src/app/community/api/comments/[id]/route.ts` (PATCH, DELETE)
4. `src/app/community/api/posts/route.ts` (POST)
5. `src/app/community/api/posts/[id]/route.ts` (PATCH, DELETE)

**Pattern for Community:**

```typescript
// Example: POST /community/api/likes/route.ts

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { storyId, postId } = await request.json();

  // Create like in database
  const [like] = await db.insert(likes)
    .values({
      id: nanoid(),
      userId: session.user.id,
      storyId,
      postId,
      createdAt: new Date(),
    })
    .returning();

  // ✅ Invalidate caches
  const invalidationContext = createInvalidationContext({
    entityType: 'story',
    entityId: storyId,
    storyId: storyId,
    includeCommunity: true,
    includeReading: true, // Reading pages show like counts
  });

  await invalidateEntityCache(invalidationContext);

  // Add specific invalidation for like counts
  await invalidateRedis([
    `story:${storyId}:likes`,
    `story:${storyId}:stats`,
    `community:posts:${postId}`,
  ]);

  const headers = getCacheInvalidationHeaders(invalidationContext);

  return NextResponse.json({ like }, { headers });
}
```

### Day 10-11: Reading Route Optimization

**Issue:** Reading routes show stale data after author edits

**Solution:** When story is published, invalidate BOTH writing AND reading caches

**Update publish endpoint:**

```typescript
// src/app/studio/api/stories/[id]/publish/route.ts

export async function POST(request: NextRequest, { params }) {
  // ... publish logic ...

  // Invalidate with BOTH writing and reading caches
  const invalidationContext = createInvalidationContext({
    entityType: 'story',
    entityId: storyId,
    storyId: storyId,
    includeReading: true, // ✅ Important!
    includeCommunity: true,
  });

  await invalidateEntityCache(invalidationContext);

  // Also invalidate published lists
  await invalidateRedis([
    'stories:published',
    'stories:featured',
    `genre:${story.genre}:published`,
  ]);

  return NextResponse.json({ story }, {
    headers: getCacheInvalidationHeaders(invalidationContext)
  });
}
```

### Day 12: Optimistic Updates for Community

**Create Optimistic Update Hook:**

**File:** `src/lib/hooks/use-optimistic-mutation.ts`

```typescript
'use client';

import { useState } from 'react';
import { mutate } from 'swr';
import { useCacheInvalidation } from './use-cache-invalidation';

interface OptimisticOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<Response>;
  optimisticData: (currentData: TData | undefined, variables: TVariables) => TData;
  rollback: (previousData: TData | undefined, variables: TVariables) => TData;
  swrKey: string; // Key to optimistically update
}

/**
 * Mutation hook with optimistic updates
 * Updates UI immediately, then confirms with server
 */
export function useOptimisticMutation<TData = any, TVariables = any>(
  options: OptimisticOptions<TData, TVariables>
) {
  const [isLoading, setIsLoading] = useState(false);
  const { handleCacheInvalidation } = useCacheInvalidation();

  const mutate = async (variables: TVariables) => {
    setIsLoading(true);

    // Store current data for rollback
    const previousData = await mutate(
      options.swrKey,
      async (currentData: TData | undefined) => {
        // Return optimistic data immediately
        return options.optimisticData(currentData, variables);
      },
      { revalidate: false } // Don't revalidate yet
    );

    try {
      // Make API call
      const response = await options.mutationFn(variables);

      if (!response.ok) {
        throw new Error('Mutation failed');
      }

      // Process cache invalidation
      handleCacheInvalidation(response.headers);

      // Revalidate to get real data
      await mutate(options.swrKey);

      return await response.json();
    } catch (error) {
      // Rollback on error
      await mutate(
        options.swrKey,
        options.rollback(previousData, variables),
        { revalidate: false }
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading };
}

// Usage example:
/*
const { mutate: toggleLike } = useOptimisticMutation({
  swrKey: `/community/api/stories/${storyId}`,
  mutationFn: async ({ storyId, liked }) =>
    fetch(`/community/api/likes`, {
      method: liked ? 'DELETE' : 'POST',
      body: JSON.stringify({ storyId }),
    }),
  optimisticData: (current, { liked }) => ({
    ...current,
    isLiked: !liked,
    likeCount: current.likeCount + (liked ? -1 : 1),
  }),
  rollback: (previous) => previous,
});
*/
```

### Day 13: Testing Community & Reading

**Test scenarios:**

1. Like story → Unlike → Like again (rapid clicks)
2. Comment on post → Edit → Delete
3. Publish story → Check reading page shows it
4. Edit published story → Check reading page updates

---

## 🏗️ Week 3: Infrastructure & Middleware

**Goal:** Make cache invalidation automatic and foolproof
**Success Metric:** Developers can't forget to invalidate cache

### Day 14-15: Cache Middleware

**File:** `src/lib/cache/cache-middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { invalidateEntityCache, getCacheInvalidationHeaders, InvalidationContext } from './unified-invalidation';

/**
 * Automatically detect entity type and invalidate caches
 */
function detectEntityFromPath(path: string): {
  entityType?: InvalidationContext['entityType'];
  route?: 'studio' | 'community' | 'novels' | 'comics';
} {
  if (path.includes('/studio/api/scenes/')) return { entityType: 'scene', route: 'studio' };
  if (path.includes('/studio/api/chapters/')) return { entityType: 'chapter', route: 'studio' };
  if (path.includes('/studio/api/stories/')) return { entityType: 'story', route: 'studio' };
  if (path.includes('/studio/api/parts/')) return { entityType: 'part', route: 'studio' };
  if (path.includes('/studio/api/characters/')) return { entityType: 'character', route: 'studio' };
  if (path.includes('/studio/api/settings/')) return { entityType: 'setting', route: 'studio' };
  if (path.includes('/community/')) return { route: 'community' };
  return {};
}

type RouteHandler = (
  request: NextRequest,
  context: any
) => Promise<NextResponse>;

export interface AutoCacheOptions {
  /**
   * Extract entity IDs from request/response
   */
  extractIds?: (request: NextRequest, response: any) => {
    entityId: string;
    storyId: string;
    chapterId?: string;
  };

  /**
   * Override auto-detection
   */
  entityType?: InvalidationContext['entityType'];

  /**
   * Additional client caches to invalidate
   */
  additionalClientCaches?: ('writing' | 'reading' | 'community')[];

  /**
   * Skip cache invalidation (for read-only operations)
   */
  skipInvalidation?: boolean;
}

/**
 * Middleware that automatically handles cache invalidation
 *
 * Usage:
 * export const PATCH = withAutoCache(handler);
 *
 * Or with options:
 * export const PATCH = withAutoCache(handler, {
 *   entityType: 'scene',
 *   additionalClientCaches: ['reading'],
 * });
 */
export function withAutoCache(
  handler: RouteHandler,
  options: AutoCacheOptions = {}
): RouteHandler {
  return async (request: NextRequest, context: any) => {
    const method = request.method;

    // Only auto-invalidate for mutations
    if (options.skipInvalidation || !['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return handler(request, context);
    }

    // Execute handler
    const response = await handler(request, context);

    // Only process successful responses
    if (!response.ok) {
      return response;
    }

    try {
      // Detect entity type from path if not provided
      const detection = detectEntityFromPath(request.url);
      const entityType = options.entityType || detection.entityType;

      if (!entityType) {
        console.warn('[AutoCache] Could not detect entity type from path:', request.url);
        return response;
      }

      // Extract IDs from response
      const responseData = await response.json();
      const ids = options.extractIds
        ? options.extractIds(request, responseData)
        : {
            entityId: responseData.id || responseData[entityType]?.id,
            storyId: responseData.storyId || responseData[entityType]?.storyId,
            chapterId: responseData.chapterId || responseData[entityType]?.chapterId,
          };

      if (!ids.entityId || !ids.storyId) {
        console.warn('[AutoCache] Missing required IDs for cache invalidation:', ids);
        return response;
      }

      // Create invalidation context
      const clientCaches = ['writing'];
      if (detection.route === 'community') clientCaches.push('community');
      if (options.additionalClientCaches) {
        clientCaches.push(...options.additionalClientCaches);
      }

      const invalidationContext: InvalidationContext = {
        entityType,
        entityId: ids.entityId,
        storyId: ids.storyId,
        chapterId: ids.chapterId,
        clientCaches: clientCaches as any,
      };

      // Invalidate server caches
      await invalidateEntityCache(invalidationContext);

      // Add cache invalidation headers
      const headers = getCacheInvalidationHeaders(invalidationContext);

      // Return new response with headers
      return NextResponse.json(responseData, {
        status: response.status,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          ...headers,
        },
      });
    } catch (error) {
      console.error('[AutoCache] Error during cache invalidation:', error);
      // Return original response even if cache invalidation fails
      return response;
    }
  };
}

// Usage examples:

// Automatic detection:
// export const PATCH = withAutoCache(async (request, { params }) => {
//   // ... handler logic
// });

// With custom options:
// export const PATCH = withAutoCache(
//   async (request, { params }) => {
//     // ... handler logic
//   },
//   {
//     entityType: 'scene',
//     additionalClientCaches: ['reading'],
//   }
// );

// With custom ID extraction:
// export const PATCH = withAutoCache(
//   async (request, { params }) => {
//     // ... handler logic
//   },
//   {
//     extractIds: (request, response) => ({
//       entityId: response.scene.id,
//       storyId: response.scene.chapter.storyId,
//       chapterId: response.scene.chapterId,
//     }),
//   }
// );
```

### Day 16-17: Refactor Endpoints to Use Middleware

**Before:**
```typescript
// src/app/studio/api/scenes/[id]/route.ts

export async function PATCH(request, { params }) {
  // ... 100 lines of code ...

  // Invalidation scattered throughout
  await onSceneMutation(...)
  const headers = getCacheInvalidationHeaders(...)

  return NextResponse.json(data, { headers })
}
```

**After:**
```typescript
// src/app/studio/api/scenes/[id]/route.ts

export const PATCH = withAutoCache(
  async (request, { params }) => {
    // ... just business logic ...
    // NO manual cache invalidation needed!

    return NextResponse.json(data)
  },
  {
    entityType: 'scene',
    extractIds: (req, res) => ({
      entityId: res.scene.id,
      storyId: res.scene.chapter.storyId,
      chapterId: res.scene.chapterId,
    }),
  }
);
```

**Refactor priority:**

1. Day 16: Studio routes (scenes, chapters, stories, parts)
2. Day 17: Community routes (likes, comments, posts)

### Day 18-19: Cache Warming & Preloading

**File:** `src/lib/cache/cache-warming.ts`

```typescript
/**
 * Enhanced cache warming with prioritization
 */

import { getCachedStoryStructure } from './story-structure-cache';
import { db } from '../db';
import { stories } from '../db/schema';
import { desc, eq } from 'drizzle-orm';

interface WarmingOptions {
  userId?: string; // Warm caches for specific user
  priority?: 'high' | 'medium' | 'low';
  maxStories?: number;
}

/**
 * Warm cache for user's stories (for /studio)
 */
export async function warmUserStories(userId: string, options: WarmingOptions = {}) {
  console.log(`[CacheWarming] Warming cache for user ${userId}`);

  const maxStories = options.maxStories || 10;

  // Get user's most recent stories
  const userStories = await db
    .select({ id: stories.id })
    .from(stories)
    .where(eq(stories.authorId, userId))
    .orderBy(desc(stories.updatedAt))
    .limit(maxStories);

  const storyIds = userStories.map(s => s.id);

  // Warm in parallel
  await Promise.all(
    storyIds.map(id => getCachedStoryStructure(id, userId))
  );

  console.log(`[CacheWarming] ✅ Warmed ${storyIds.length} stories for user ${userId}`);

  return { warmedCount: storyIds.length, storyIds };
}

/**
 * Warm cache for popular/featured stories (for /novels, /comics, /community)
 */
export async function warmPopularStories(options: WarmingOptions = {}) {
  console.log('[CacheWarming] Warming popular stories cache');

  const maxStories = options.maxStories || 20;

  // Get published stories ordered by views
  const popularStories = await db
    .select({ id: stories.id })
    .from(stories)
    .where(eq(stories.status, 'published'))
    .orderBy(desc(stories.viewCount))
    .limit(maxStories);

  const storyIds = popularStories.map(s => s.id);

  // Warm in parallel
  await Promise.all(
    storyIds.map(id => getCachedStoryStructure(id))
  );

  console.log(`[CacheWarming] ✅ Warmed ${storyIds.length} popular stories`);

  return { warmedCount: storyIds.length, storyIds };
}

/**
 * Smart cache warming - called after invalidation
 */
export async function smartWarm(storyId: string, userId?: string) {
  console.log(`[CacheWarming] Smart warming for story ${storyId}`);

  try {
    // Immediately warm the invalidated story
    await getCachedStoryStructure(storyId, userId);

    console.log(`[CacheWarming] ✅ Smart warmed story ${storyId}`);
  } catch (error) {
    console.error(`[CacheWarming] Failed to smart warm story ${storyId}:`, error);
  }
}
```

**Integrate with invalidation:**

```typescript
// In unified-invalidation.ts

export async function invalidateEntityCache(context: InvalidationContext): Promise<void> {
  // ... existing invalidation ...

  // ✅ NEW: Smart cache warming after invalidation
  // This pre-populates the cache so next request is fast
  await smartWarm(context.storyId);
}
```

### Day 20: Infrastructure Testing

**Test:**
- [ ] Middleware auto-detects entity types
- [ ] Middleware adds correct headers
- [ ] Cache warming reduces response time
- [ ] Middleware works with ALL routes

---

## 📊 Week 4: Monitoring & Debugging

**Goal:** Visibility into cache performance
**Success Metric:** Dashboard showing cache hit rates, invalidation logs

### Day 21-22: Cache Metrics

**File:** `src/lib/cache/cache-metrics.ts`

```typescript
/**
 * Cache Metrics Collection
 */

interface CacheEvent {
  timestamp: number;
  type: 'hit' | 'miss' | 'invalidation' | 'error';
  layer: 'redis' | 'localStorage' | 'swr';
  key: string;
  duration?: number;
  metadata?: Record<string, any>;
}

class CacheMetricsCollector {
  private events: CacheEvent[] = [];
  private maxEvents = 1000; // Keep last 1000 events

  recordHit(layer: CacheEvent['layer'], key: string, duration?: number) {
    this.addEvent({
      timestamp: Date.now(),
      type: 'hit',
      layer,
      key,
      duration,
    });
  }

  recordMiss(layer: CacheEvent['layer'], key: string, duration?: number) {
    this.addEvent({
      timestamp: Date.now(),
      type: 'miss',
      layer,
      key,
      duration,
    });
  }

  recordInvalidation(layer: CacheEvent['layer'], key: string, metadata?: Record<string, any>) {
    this.addEvent({
      timestamp: Date.now(),
      type: 'invalidation',
      layer,
      key,
      metadata,
    });
  }

  recordError(layer: CacheEvent['layer'], key: string, metadata?: Record<string, any>) {
    this.addEvent({
      timestamp: Date.now(),
      type: 'error',
      layer,
      key,
      metadata,
    });
  }

  private addEvent(event: CacheEvent) {
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  getMetrics(timeWindowMs: number = 60000) {
    const cutoff = Date.now() - timeWindowMs;
    const recentEvents = this.events.filter(e => e.timestamp >= cutoff);

    const byLayer = {
      redis: { hits: 0, misses: 0, invalidations: 0, errors: 0 },
      localStorage: { hits: 0, misses: 0, invalidations: 0, errors: 0 },
      swr: { hits: 0, misses: 0, invalidations: 0, errors: 0 },
    };

    recentEvents.forEach(event => {
      if (event.type === 'hit') byLayer[event.layer].hits++;
      else if (event.type === 'miss') byLayer[event.layer].misses++;
      else if (event.type === 'invalidation') byLayer[event.layer].invalidations++;
      else if (event.type === 'error') byLayer[event.layer].errors++;
    });

    return {
      timeWindow: timeWindowMs,
      totalEvents: recentEvents.length,
      byLayer,
      hitRate: {
        redis: byLayer.redis.hits / (byLayer.redis.hits + byLayer.redis.misses) || 0,
        localStorage: byLayer.localStorage.hits / (byLayer.localStorage.hits + byLayer.localStorage.misses) || 0,
        swr: byLayer.swr.hits / (byLayer.swr.hits + byLayer.swr.misses) || 0,
      },
      recentEvents: recentEvents.slice(-20), // Last 20 events
    };
  }

  clearMetrics() {
    this.events = [];
  }
}

export const metricsCollector = new CacheMetricsCollector();
```

**Integrate with cache layers:**

```typescript
// In redis-cache.ts
export class RedisCache {
  async get<T>(key: string): Promise<T | null> {
    const start = Date.now();
    const value = await this.client.get(key);
    const duration = Date.now() - start;

    if (value) {
      metricsCollector.recordHit('redis', key, duration);
    } else {
      metricsCollector.recordMiss('redis', key, duration);
    }

    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
    metricsCollector.recordInvalidation('redis', key);
  }
}
```

### Day 23: Cache Debug Panel

**File:** `src/app/debug/cache/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { metricsCollector } from '@/lib/cache/cache-metrics';
import { cacheManager } from '@/lib/hooks/use-persisted-swr';

export default function CacheDebugPage() {
  const [metrics, setMetrics] = useState(null);
  const [localStorageStats, setLocalStorageStats] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(metricsCollector.getMetrics());
      setLocalStorageStats(cacheManager.getCacheStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!metrics || !localStorageStats) return <div>Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Cache Debug Panel</h1>

      {/* Hit Rates */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold">Redis Cache</h2>
          <div className="text-3xl">{(metrics.hitRate.redis * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-600">
            {metrics.byLayer.redis.hits} hits / {metrics.byLayer.redis.misses} misses
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold">localStorage</h2>
          <div className="text-3xl">{(metrics.hitRate.localStorage * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-600">
            {metrics.byLayer.localStorage.hits} hits / {metrics.byLayer.localStorage.misses} misses
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold">SWR Memory</h2>
          <div className="text-3xl">{(metrics.hitRate.swr * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-600">
            {metrics.byLayer.swr.hits} hits / {metrics.byLayer.swr.misses} misses
          </div>
        </div>
      </div>

      {/* localStorage Stats */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="font-semibold text-xl mb-4">localStorage Usage</h2>
        <div className="mb-2">
          <strong>Total Size:</strong> {(localStorageStats.totalSize / 1024).toFixed(2)} KB
        </div>
        <div className="mb-2">
          <strong>Total Entries:</strong> {localStorageStats.totalEntries}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {Object.entries(localStorageStats.byPage).map(([page, stats]) => (
            <div key={page} className="border p-3 rounded">
              <div className="font-medium">{page}</div>
              <div className="text-sm">
                {stats.entries} entries, {(stats.size / 1024).toFixed(2)} KB
              </div>
              <div className="text-xs text-gray-500">
                Last: {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="font-semibold text-xl mb-4">Recent Cache Events</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {metrics.recentEvents.map((event, i) => (
            <div key={i} className="text-sm border-l-4 border-gray-300 pl-3 py-1">
              <span className={`font-medium ${
                event.type === 'hit' ? 'text-green-600' :
                event.type === 'miss' ? 'text-yellow-600' :
                event.type === 'invalidation' ? 'text-blue-600' :
                'text-red-600'
              }`}>
                {event.type.toUpperCase()}
              </span>
              <span className="mx-2">•</span>
              <span className="text-gray-600">{event.layer}</span>
              <span className="mx-2">•</span>
              <span className="font-mono text-xs">{event.key}</span>
              {event.duration && (
                <>
                  <span className="mx-2">•</span>
                  <span>{event.duration}ms</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 space-x-4">
        <button
          onClick={() => {
            cacheManager.clearAllCache();
            alert('All localStorage cache cleared');
          }}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Clear All localStorage Cache
        </button>

        <button
          onClick={() => {
            metricsCollector.clearMetrics();
            alert('Metrics cleared');
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Clear Metrics
        </button>
      </div>
    </div>
  );
}
```

### Day 24: Documentation & Training

**Create developer documentation:**

**File:** `docs/cache-invalidation-guide.md`

```markdown
# Cache Invalidation Developer Guide

## Quick Start

When creating a mutation endpoint, use the auto-cache middleware:

```typescript
import { withAutoCache } from '@/lib/cache/cache-middleware';

export const PATCH = withAutoCache(
  async (request, { params }) => {
    // Your mutation logic
    const result = await updateEntity(...);

    return NextResponse.json(result);
  }
);
```

That's it! Cache invalidation happens automatically.

## Manual Cache Invalidation

If you need manual control:

```typescript
import { invalidateEntityCache, createInvalidationContext } from '@/lib/cache/unified-invalidation';

// After mutation
await invalidateEntityCache(
  createInvalidationContext({
    entityType: 'scene',
    entityId: sceneId,
    storyId: storyId,
    chapterId: chapterId,
  })
);
```

## Client-Side Usage

Use the mutation hook:

```typescript
import { useMutationWithCache } from '@/lib/hooks/use-mutation-with-cache';

const { mutate, isLoading } = useMutationWithCache({
  mutationFn: async (data) => fetch('/api/...', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  onSuccess: () => toast.success('Saved!'),
});
```

## Testing Cache Invalidation

Visit `/debug/cache` to see:
- Hit rates for all cache layers
- Recent cache events
- localStorage usage
- Manual cache clearing

## Troubleshooting

**Problem:** Cache not invalidating

**Solution:**
1. Check response headers include `X-Cache-Invalidate`
2. Verify console shows invalidation logs
3. Check `/debug/cache` for events

**Problem:** Stale data persists

**Solution:**
1. Clear localStorage manually
2. Check TTL values
3. Verify mutation returns correct storyId
```

### Day 25: Final Testing & Rollout

**Comprehensive E2E test:**

```typescript
test('complete cache invalidation workflow', async ({ page }) => {
  // 1. Writer edits scene
  // 2. Save mutation
  // 3. Check Redis invalidated (server logs)
  // 4. Check localStorage invalidated (browser)
  // 5. Check SWR invalidated (network)
  // 6. Refresh page
  // 7. Verify fresh data loaded
  // 8. Reader views story
  // 9. Verify reading cache updated
  // 10. Community shows updated stats
});
```

**Rollout Plan:**

1. **Day 25 Morning:** Deploy to staging
2. **Day 25 Afternoon:** Full QA testing
3. **Day 25 Evening:** Deploy to production (off-peak hours)
4. **Day 26-27:** Monitor metrics, fix any issues

---

## 🚨 Risk Mitigation

### Rollback Plan

**If cache invalidation causes issues:**

```typescript
// Feature flag in .env
ENABLE_AUTO_CACHE_INVALIDATION=false

// In cache-middleware.ts
export function withAutoCache(handler, options) {
  if (process.env.ENABLE_AUTO_CACHE_INVALIDATION === 'false') {
    // Bypass middleware, use old behavior
    return handler;
  }

  // New behavior
  return /* ... */;
}
```

### Gradual Rollout

**Week 1:** Enable for Studio only
**Week 2:** Enable for Community
**Week 3:** Enable for all routes
**Week 4:** Remove feature flag

### Monitoring Alerts

**Set up alerts for:**
- Cache hit rate < 60%
- Cache invalidation errors > 5/min
- Response time > 1s
- localStorage quota exceeded errors

---

## 📈 Success Metrics

### Week 1 Targets
- [ ] 100% Studio mutation coverage
- [ ] 0 "lost edit" user reports
- [ ] Cache hit rate > 70%

### Week 2 Targets
- [ ] 100% Community mutation coverage
- [ ] Like/comment actions reflect immediately
- [ ] Published stories appear in <30s

### Week 3 Targets
- [ ] All routes use middleware
- [ ] Code reduction: -50% cache-related code
- [ ] Developer onboarding time: <10min

### Week 4 Targets
- [ ] Cache hit rate > 80%
- [ ] Average response time < 50ms (cached)
- [ ] 0 cache-related bugs in production
- [ ] Debug dashboard in use

---

## 📦 Deliverables Checklist

### Code
- [ ] `src/lib/cache/unified-invalidation.ts`
- [ ] `src/lib/cache/cache-middleware.ts`
- [ ] `src/lib/cache/cache-metrics.ts`
- [ ] `src/lib/hooks/use-cache-invalidation.ts`
- [ ] `src/lib/hooks/use-mutation-with-cache.ts`
- [ ] `src/lib/hooks/use-optimistic-mutation.ts`
- [ ] Updated: All Studio API routes
- [ ] Updated: All Community API routes
- [ ] Updated: UnifiedWritingEditor component

### Tests
- [ ] `tests/cache-invalidation-studio.spec.ts`
- [ ] `tests/cache-invalidation-community.spec.ts`
- [ ] `tests/cache-middleware.spec.ts`
- [ ] Unit tests for all cache utilities

### Documentation
- [ ] `docs/cache-invalidation-guide.md`
- [ ] `CACHE-INVALIDATION-AUDIT.md` (completed)
- [ ] `CACHE-INVALIDATION-IMPLEMENTATION-PLAN.md` (this file)
- [ ] Code comments and JSDoc

### Monitoring
- [ ] `/debug/cache` debug panel
- [ ] Metrics collection active
- [ ] Logging configured
- [ ] Alerts configured

---

## 👥 Team Coordination

**Roles:**

- **Developer 1 (Week 1):** Studio API routes + tests
- **Developer 2 (Week 2):** Community API routes + optimistic updates
- **Developer 3 (Week 3):** Middleware + refactoring
- **QA (Week 4):** Testing + monitoring setup

**Daily Standups:**
- Progress on current week goals
- Blockers or issues
- Cache metrics review

**Weekly Reviews:**
- Demo working cache invalidation
- Review metrics and hit rates
- Adjust plan if needed

---

## 🎯 Post-Implementation

### Month 1
- Monitor cache hit rates
- Collect user feedback
- Fix edge cases

### Month 2
- Optimize TTL values based on data
- Add predictive cache warming
- Performance tuning

### Month 3
- Consider CDN caching layer
- Implement stale-while-revalidate
- Advanced metrics & analytics

---

**Status:** 📋 **READY FOR IMPLEMENTATION**
**Estimated Effort:** 4 weeks (80 hours)
**Impact:** Fixes critical data consistency bugs
**ROI:** High - prevents user frustration and data loss

---

*Implementation Plan Created: November 2, 2025*
*Plan Version: 1.0.0*
*Next Review: After Week 1 completion*

/**
 * Client-Side Cache Invalidation Hook
 *
 * Handles cache invalidation on the client side by reading headers
 * from API responses and clearing localStorage and SWR caches.
 *
 * Usage:
 *   const { handleCacheInvalidation } = useCacheInvalidation();
 *
 *   const response = await fetch('/api/...', { method: 'PATCH', ... });
 *   handleCacheInvalidation(response.headers);
 */

'use client';

import { useCallback } from 'react';
import { mutate } from 'swr';
import { cacheManager } from '../hooks/use-persisted-swr';
import { cacheMetrics } from '../cache/cache-metrics';

/**
 * Client-side cache types that can be invalidated
 */
export type ClientCacheType =
  | 'writing'
  | 'reading'
  | 'community'
  | 'analytics'
  | 'browse';

/**
 * Hook for handling cache invalidation on the client side
 */
export function useCacheInvalidation() {
  /**
   * Handle cache invalidation from API response headers
   *
   * Reads X-Cache-Invalidate headers and clears appropriate caches:
   * - localStorage (via CacheManager)
   * - SWR memory cache (via mutate)
   */
  const handleCacheInvalidation = useCallback((headers: Headers) => {
    // 1. Invalidate localStorage caches based on page types
    const cacheTypes = headers.get('X-Cache-Invalidate');
    if (cacheTypes) {
      const types = cacheTypes.split(',').map((t) => t.trim());
      types.forEach((type) => {
        cacheManager.invalidatePageCache(type as ClientCacheType);
        cacheMetrics.invalidate('localStorage', type);
      });
    }

    // 2. Invalidate SWR cache keys
    const cacheKeys = headers.get('X-Cache-Invalidate-Keys');
    if (cacheKeys) {
      const keys = cacheKeys.split(',').map((k) => k.trim());

      // For each key, invalidate all SWR cache entries that contain it
      keys.forEach((key) => {
        // Use SWR's mutate with a filter function to invalidate matching keys
        mutate(
          (swrKey) => {
            if (typeof swrKey === 'string') {
              return swrKey.includes(key);
            }
            return false;
          },
          undefined,
          { revalidate: true }
        );
        cacheMetrics.invalidate('swr', key);
      });
    }

    // 3. Log invalidation for debugging
    const timestamp = headers.get('X-Cache-Invalidate-Timestamp');
    if (timestamp) {
      console.log(`[Cache Invalidation] ${timestamp}`, {
        pageTypes: cacheTypes,
        cacheKeys: cacheKeys,
      });
    }
  }, []);

  /**
   * Manually invalidate specific cache types
   *
   * Use when you need to invalidate caches without an API response.
   */
  const invalidatePageCache = useCallback((pageType: ClientCacheType) => {
    cacheManager.invalidatePageCache(pageType);
  }, []);

  /**
   * Manually invalidate specific SWR keys
   *
   * Use when you need to invalidate SWR cache without an API response.
   */
  const invalidateSWRKeys = useCallback((keys: string[]) => {
    keys.forEach((key) => {
      mutate(
        (swrKey) => {
          if (typeof swrKey === 'string') {
            return swrKey.includes(key);
          }
          return false;
        },
        undefined,
        { revalidate: true }
      );
    });
  }, []);

  /**
   * Clear all client-side caches
   *
   * Nuclear option - clears everything.
   * Use with caution!
   */
  const clearAllCaches = useCallback(() => {
    // Clear all localStorage page caches
    const pageTypes: ClientCacheType[] = [
      'writing',
      'reading',
      'community',
      'analytics',
      'browse',
    ];
    pageTypes.forEach((type) => {
      cacheManager.clearPageCache(type);
    });

    // Clear all SWR cache
    mutate(() => true, undefined, { revalidate: false });

    console.log('[Cache Invalidation] All caches cleared');
  }, []);

  return {
    handleCacheInvalidation,
    invalidatePageCache,
    invalidateSWRKeys,
    clearAllCaches,
  };
}

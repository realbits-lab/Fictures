'use client';

import { useCallback } from 'react';
import { mutate } from 'swr';
import { CACHE_CONFIGS, cacheManager } from '@/lib/hooks/use-persisted-swr';

/**
 * Hook for prefetching adjacent scenes to improve navigation performance
 * Populates SWR cache with scene data before user navigates
 */
export function useScenePrefetch() {
  const prefetchScene = useCallback(async (chapterId: string) => {
    if (!chapterId) return;

    const prefetchStartTime = performance.now();
    const prefetchId = Math.random().toString(36).substring(7);
    const url = `/writing/api/chapters/${chapterId}/scenes`;

    console.log(`[${prefetchId}] 🔮 PREFETCH START for chapter: ${chapterId}`);

    try {
      // Check if already in cache (check BOTH localStorage and SWR in-memory cache)
      const cacheCheckStartTime = performance.now();

      // First check localStorage (persistent cache)
      const localStorageData = cacheManager.getCachedData(url, {
        ...CACHE_CONFIGS.reading,
        ttl: 5 * 60 * 1000  // 5min cache for scenes
      });

      // Then check SWR in-memory cache
      const swrData = await mutate(url, undefined, { revalidate: false });

      const cacheCheckDuration = performance.now() - cacheCheckStartTime;

      // If data exists in EITHER cache, consider it a hit
      if (localStorageData || swrData) {
        const totalDuration = performance.now() - prefetchStartTime;
        const cacheSource = localStorageData ? 'localStorage' : 'SWR in-memory';
        console.log(`[${prefetchId}] ✅ Cache HIT - Already in ${cacheSource} (${cacheCheckDuration.toFixed(2)}ms, Total: ${totalDuration.toFixed(2)}ms)`);

        // If only in localStorage, populate SWR cache for instant access
        if (localStorageData && !swrData) {
          await mutate(url, localStorageData, { revalidate: false });
          console.log(`[${prefetchId}] 🔄 Populated SWR cache from localStorage`);
        }

        return;
      }

      console.log(`[${prefetchId}] 🔮 Prefetching uncached scene - Not yet cached (Cache check: ${cacheCheckDuration.toFixed(2)}ms)`);

      // Prefetch with low priority
      const fetchStartTime = performance.now();
      const response = await fetch(url, {
        credentials: 'include',
        priority: 'low' as RequestPriority,
      });
      const fetchDuration = performance.now() - fetchStartTime;
      console.log(`[${prefetchId}] 🌐 Prefetch fetch completed: ${fetchDuration.toFixed(2)}ms (Status: ${response.status})`);

      if (response.ok) {
        const parseStartTime = performance.now();
        const data = await response.json();
        const parseDuration = performance.now() - parseStartTime;
        console.log(`[${prefetchId}] 📦 Parse completed: ${parseDuration.toFixed(2)}ms`);

        // Populate SWR cache
        const mutateStartTime = performance.now();
        await mutate(url, data, { revalidate: false });
        const mutateDuration = performance.now() - mutateStartTime;
        console.log(`[${prefetchId}] 💾 SWR cache update: ${mutateDuration.toFixed(2)}ms`);

        const totalDuration = performance.now() - prefetchStartTime;
        console.log(`[${prefetchId}] ✅ Prefetch completed: ${totalDuration.toFixed(2)}ms (${data.scenes?.length || 0} scenes)`);
        console.log(`[${prefetchId}] 📊 Breakdown: CacheCheck=${cacheCheckDuration.toFixed(0)}ms, Fetch=${fetchDuration.toFixed(0)}ms, Parse=${parseDuration.toFixed(0)}ms, Mutate=${mutateDuration.toFixed(0)}ms`);
      } else {
        const totalDuration = performance.now() - prefetchStartTime;
        console.warn(`[${prefetchId}] ⚠️  Prefetch failed with status ${response.status} after ${totalDuration.toFixed(2)}ms`);
      }
    } catch (error) {
      const totalDuration = performance.now() - prefetchStartTime;
      console.debug(`[${prefetchId}] ⚠️  Prefetch error after ${totalDuration.toFixed(2)}ms:`, error);
      // Silently fail - prefetch is optional
    }
  }, []);

  const prefetchAdjacentScenes = useCallback(async (
    currentChapterId: string,
    prevChapterId?: string,
    nextChapterId?: string
  ) => {
    const batchStartTime = performance.now();
    const batchId = Math.random().toString(36).substring(7);

    console.log(`[${batchId}] 🔮 PREFETCH BATCH START - Current: ${currentChapterId}, Prev: ${prevChapterId || 'none'}, Next: ${nextChapterId || 'none'}`);

    // Prefetch current chapter scenes first (if not already loaded)
    const currentStartTime = performance.now();
    await prefetchScene(currentChapterId);
    const currentDuration = performance.now() - currentStartTime;
    console.log(`[${batchId}] ✓ Current chapter prefetch: ${currentDuration.toFixed(2)}ms`);

    // Then prefetch adjacent chapters in background
    const prefetchPromises: Promise<void>[] = [];

    if (nextChapterId && nextChapterId !== currentChapterId) {
      prefetchPromises.push(prefetchScene(nextChapterId));
    }

    if (prevChapterId && prevChapterId !== currentChapterId) {
      prefetchPromises.push(prefetchScene(prevChapterId));
    }

    // Fire and forget - don't await
    if (prefetchPromises.length > 0) {
      console.log(`[${batchId}] 🚀 Firing ${prefetchPromises.length} adjacent prefetch(es) in background`);
      Promise.all(prefetchPromises)
        .then(() => {
          const totalDuration = performance.now() - batchStartTime;
          console.log(`[${batchId}] ✅ All prefetches completed: ${totalDuration.toFixed(2)}ms`);
        })
        .catch(() => {
          const totalDuration = performance.now() - batchStartTime;
          console.log(`[${batchId}] ⚠️  Some prefetches failed: ${totalDuration.toFixed(2)}ms`);
        });
    } else {
      const totalDuration = performance.now() - batchStartTime;
      console.log(`[${batchId}] ✅ Prefetch batch completed: ${totalDuration.toFixed(2)}ms (no adjacent chapters)`);
    }
  }, [prefetchScene]);

  return {
    prefetchScene,
    prefetchAdjacentScenes
  };
}

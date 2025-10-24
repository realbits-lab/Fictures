'use client';

import { useCallback } from 'react';
import { mutate } from 'swr';

/**
 * Hook for prefetching adjacent scenes to improve navigation performance
 * Populates SWR cache with scene data before user navigates
 */
export function useScenePrefetch() {
  const prefetchScene = useCallback(async (chapterId: string) => {
    if (!chapterId) return;

    const url = `/writing/api/chapters/${chapterId}/scenes`;

    try {
      // Check if already in cache
      const cachedData = await mutate(url, undefined, { revalidate: false });
      if (cachedData) {
        console.log(`✓ Scene data already cached for chapter ${chapterId}`);
        return;
      }

      // Prefetch with low priority
      console.log(`⏳ Prefetching scenes for chapter ${chapterId}...`);
      const response = await fetch(url, {
        credentials: 'include',
        priority: 'low' as RequestPriority,
      });

      if (response.ok) {
        const data = await response.json();
        // Populate SWR cache
        await mutate(url, data, { revalidate: false });
        console.log(`✓ Prefetched ${data.scenes?.length || 0} scenes for chapter ${chapterId}`);
      }
    } catch (error) {
      console.debug('Prefetch failed for chapter:', chapterId, error);
      // Silently fail - prefetch is optional
    }
  }, []);

  const prefetchAdjacentScenes = useCallback(async (
    currentChapterId: string,
    prevChapterId?: string,
    nextChapterId?: string
  ) => {
    // Prefetch current chapter scenes first (if not already loaded)
    await prefetchScene(currentChapterId);

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
      Promise.all(prefetchPromises).catch(() => {
        // Silently handle errors
      });
    }
  }, [prefetchScene]);

  return {
    prefetchScene,
    prefetchAdjacentScenes
  };
}

/**
 * Prefetching Utilities Hook
 *
 * Provides intelligent prefetching strategies to improve perceived performance.
 * Prefetches data before the user needs it based on various triggers.
 *
 * Usage:
 *   const { prefetchOnHover, prefetchOnVisible, prefetchOnIdle } = usePrefetch();
 *
 *   <Link onMouseEnter={() => prefetchOnHover('/studio/api/stories/123')}>
 *     Story
 *   </Link>
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { mutate } from 'swr';
import { cacheMetrics } from '../cache/cache-metrics';

/**
 * Prefetch priority levels
 */
export type PrefetchPriority = 'high' | 'low' | 'auto';

/**
 * Prefetch strategy types
 */
export type PrefetchStrategy = 'hover' | 'visible' | 'idle' | 'immediate';

/**
 * Prefetch options
 */
export interface PrefetchOptions {
  /**
   * Request priority (default: 'low')
   */
  priority?: PrefetchPriority;

  /**
   * Force refresh even if cached (default: false)
   */
  force?: boolean;

  /**
   * Delay before prefetching in ms (default: 0)
   */
  delay?: number;

  /**
   * Additional fetch options
   */
  fetchOptions?: RequestInit;

  /**
   * Success callback
   */
  onSuccess?: (data: unknown) => void;

  /**
   * Error callback
   */
  onError?: (error: Error) => void;
}

/**
 * Prefetch state tracking
 */
interface PrefetchState {
  isPrefetching: boolean;
  prefetchedUrls: Set<string>;
  prefetchTimers: Map<string, NodeJS.Timeout>;
}

/**
 * Hook for intelligent prefetching
 */
export function usePrefetch() {
  const stateRef = useRef<PrefetchState>({
    isPrefetching: false,
    prefetchedUrls: new Set(),
    prefetchTimers: new Map(),
  });

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      stateRef.current.prefetchTimers.forEach((timer) => clearTimeout(timer));
      stateRef.current.prefetchTimers.clear();
    };
  }, []);

  /**
   * Core prefetch function
   */
  const prefetch = useCallback(
    async (url: string, options: PrefetchOptions = {}): Promise<void> => {
      const state = stateRef.current;

      // Skip if already prefetched (unless force refresh)
      if (!options.force && state.prefetchedUrls.has(url)) {
        return;
      }

      const startTime = Date.now();

      try {
        state.isPrefetching = true;

        // Check if already cached
        const cached = await mutate(url, undefined, { revalidate: false });
        if (cached !== undefined && !options.force) {
          state.prefetchedUrls.add(url);
          return;
        }

        // Fetch with specified priority
        const response = await fetch(url, {
          priority: options.priority || 'low',
          ...options.fetchOptions,
        });

        if (!response.ok) {
          throw new Error(`Prefetch failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Update SWR cache
        await mutate(url, data, { revalidate: false });

        // Mark as prefetched
        state.prefetchedUrls.add(url);

        // Track metrics
        const duration = Date.now() - startTime;
        cacheMetrics.set('swr', url, duration);

        // Call success callback
        if (options.onSuccess) {
          options.onSuccess(data);
        }

        console.log(`[Prefetch] ✅ ${url} (${duration}ms)`);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown prefetch error');

        // Call error callback
        if (options.onError) {
          options.onError(err);
        }

        console.error(`[Prefetch] ❌ ${url}:`, err.message);
      } finally {
        state.isPrefetching = false;
      }
    },
    []
  );

  /**
   * Prefetch on hover
   * Call this from onMouseEnter event handler
   */
  const prefetchOnHover = useCallback(
    (url: string, options: PrefetchOptions = {}) => {
      const delay = options.delay ?? 100; // Small delay to avoid prefetching on quick mouse movements

      const timer = setTimeout(() => {
        prefetch(url, { ...options, priority: 'low' });
      }, delay);

      stateRef.current.prefetchTimers.set(url, timer);
    },
    [prefetch]
  );

  /**
   * Cancel hover prefetch
   * Call this from onMouseLeave event handler
   */
  const cancelHoverPrefetch = useCallback((url: string) => {
    const timer = stateRef.current.prefetchTimers.get(url);
    if (timer) {
      clearTimeout(timer);
      stateRef.current.prefetchTimers.delete(url);
    }
  }, []);

  /**
   * Prefetch when element becomes visible
   * Uses Intersection Observer API
   */
  const prefetchOnVisible = useCallback(
    (url: string, element: HTMLElement | null, options: PrefetchOptions = {}) => {
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              prefetch(url, { ...options, priority: 'low' });
              observer.disconnect();
            }
          });
        },
        {
          rootMargin: '50px', // Start prefetching 50px before element is visible
        }
      );

      observer.observe(element);

      return () => observer.disconnect();
    },
    [prefetch]
  );

  /**
   * Prefetch during browser idle time
   * Uses requestIdleCallback API
   */
  const prefetchOnIdle = useCallback(
    (url: string, options: PrefetchOptions = {}) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          prefetch(url, { ...options, priority: 'low' });
        });
      } else {
        // Fallback to setTimeout if requestIdleCallback not available
        setTimeout(() => {
          prefetch(url, { ...options, priority: 'low' });
        }, 100);
      }
    },
    [prefetch]
  );

  /**
   * Prefetch immediately
   */
  const prefetchImmediate = useCallback(
    (url: string, options: PrefetchOptions = {}) => {
      return prefetch(url, { ...options, priority: 'high' });
    },
    [prefetch]
  );

  /**
   * Batch prefetch multiple URLs
   */
  const prefetchBatch = useCallback(
    async (urls: string[], options: PrefetchOptions = {}): Promise<void> => {
      console.log(`[Prefetch] Batch prefetching ${urls.length} URLs...`);

      const startTime = Date.now();

      // Prefetch in parallel with Promise.all
      await Promise.allSettled(
        urls.map((url) => prefetch(url, { ...options, priority: 'low' }))
      );

      const duration = Date.now() - startTime;
      console.log(
        `[Prefetch] ✅ Batch completed ${urls.length} URLs in ${duration}ms (${(duration / urls.length).toFixed(2)}ms avg)`
      );
    },
    [prefetch]
  );

  /**
   * Clear prefetch cache
   */
  const clearPrefetchCache = useCallback(() => {
    stateRef.current.prefetchedUrls.clear();
    stateRef.current.prefetchTimers.forEach((timer) => clearTimeout(timer));
    stateRef.current.prefetchTimers.clear();
    console.log('[Prefetch] Cache cleared');
  }, []);

  /**
   * Get prefetch statistics
   */
  const getPrefetchStats = useCallback(() => {
    return {
      prefetchedUrls: Array.from(stateRef.current.prefetchedUrls),
      prefetchedCount: stateRef.current.prefetchedUrls.size,
      isPrefetching: stateRef.current.isPrefetching,
      pendingTimers: stateRef.current.prefetchTimers.size,
    };
  }, []);

  return {
    // Core prefetch functions
    prefetch,
    prefetchOnHover,
    prefetchOnVisible,
    prefetchOnIdle,
    prefetchImmediate,
    prefetchBatch,

    // Utility functions
    cancelHoverPrefetch,
    clearPrefetchCache,
    getPrefetchStats,
  };
}

/**
 * Smart Prefetcher Hook
 *
 * Automatically prefetches based on user navigation patterns.
 * Learns from user behavior to predict and prefetch likely next pages.
 *
 * Usage:
 *   const { registerNavigation } = useSmartPrefetch();
 *
 *   // Call this when user navigates
 *   registerNavigation('/stories/123');
 */
export function useSmartPrefetch() {
  const { prefetch, prefetchBatch } = usePrefetch();

  // Navigation history (limited to last 10 navigations)
  const navigationHistoryRef = useRef<string[]>([]);

  // Navigation patterns: Map<current_page, Map<next_page, count>>
  const patternsRef = useRef<Map<string, Map<string, number>>>(new Map());

  /**
   * Register a navigation event
   */
  const registerNavigation = useCallback(
    (url: string) => {
      const history = navigationHistoryRef.current;

      // Add to history
      history.push(url);
      if (history.length > 10) {
        history.shift();
      }

      // Update patterns
      if (history.length >= 2) {
        const previousUrl = history[history.length - 2];
        const currentUrl = url;

        // Get or create pattern map for previous URL
        if (!patternsRef.current.has(previousUrl)) {
          patternsRef.current.set(previousUrl, new Map());
        }

        const patternMap = patternsRef.current.get(previousUrl)!;
        const currentCount = patternMap.get(currentUrl) || 0;
        patternMap.set(currentUrl, currentCount + 1);
      }
    },
    []
  );

  /**
   * Predict and prefetch likely next pages
   */
  const prefetchPredicted = useCallback(
    (currentUrl: string, threshold: number = 0.3) => {
      const patternMap = patternsRef.current.get(currentUrl);
      if (!patternMap) return;

      // Calculate total navigations from this page
      const totalNavigations = Array.from(patternMap.values()).reduce(
        (sum, count) => sum + count,
        0
      );

      // Find pages with probability above threshold
      const predictedUrls: string[] = [];
      patternMap.forEach((count, nextUrl) => {
        const probability = count / totalNavigations;
        if (probability >= threshold) {
          predictedUrls.push(nextUrl);
        }
      });

      // Prefetch predicted pages
      if (predictedUrls.length > 0) {
        console.log(
          `[Smart Prefetch] Predicted ${predictedUrls.length} likely next pages from ${currentUrl}`
        );
        prefetchBatch(predictedUrls);
      }
    },
    [prefetchBatch]
  );

  /**
   * Get navigation patterns
   */
  const getPatterns = useCallback(() => {
    const patterns: Record<string, Record<string, number>> = {};

    patternsRef.current.forEach((patternMap, fromUrl) => {
      patterns[fromUrl] = {};
      patternMap.forEach((count, toUrl) => {
        patterns[fromUrl][toUrl] = count;
      });
    });

    return patterns;
  }, []);

  /**
   * Clear learned patterns
   */
  const clearPatterns = useCallback(() => {
    navigationHistoryRef.current = [];
    patternsRef.current.clear();
    console.log('[Smart Prefetch] Patterns cleared');
  }, []);

  return {
    registerNavigation,
    prefetchPredicted,
    getPatterns,
    clearPatterns,
  };
}

/**
 * Prefetch strategies for common flows
 */
export const prefetchStrategies = {
  /**
   * Story reading flow
   * Prefetch next chapter when user scrolls to bottom
   */
  storyReading: (currentChapterId: string, nextChapterId: string | null) => {
    if (!nextChapterId) return;

    const { prefetchOnVisible } = usePrefetch();

    // Prefetch when user reaches 80% scroll
    const handleScroll = () => {
      const scrollPercentage =
        (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;

      if (scrollPercentage >= 0.8) {
        prefetchOnVisible(
          `/studio/api/chapters/${nextChapterId}`,
          document.documentElement
        );
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  },

  /**
   * Story editing flow
   * Prefetch characters and settings when opening editor
   */
  storyEditing: (storyId: string) => {
    const { prefetchBatch } = usePrefetch();

    prefetchBatch([
      `/studio/api/stories/${storyId}/characters`,
      `/studio/api/stories/${storyId}/settings`,
      `/studio/api/stories/${storyId}/chapters`,
    ]);
  },

  /**
   * Community browsing flow
   * Prefetch story details when hovering over story cards
   */
  communityBrowsing: (storyIds: string[]) => {
    const { prefetchOnHover } = usePrefetch();

    return (storyId: string) => {
      prefetchOnHover(`/studio/api/stories/${storyId}`);
    };
  },
};

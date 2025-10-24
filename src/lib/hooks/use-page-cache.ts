'use client';

import { usePersistedSWR, CACHE_CONFIGS } from './use-persisted-swr';

// Shared fetcher function with timing
const fetcher = async (url: string) => {
  const fetchStart = performance.now();
  console.log(`[fetcher] 🌐 Starting fetch: ${url}`);

  try {
    const response = await fetch(url);
    const fetchEnd = performance.now();
    const fetchDuration = Math.round(fetchEnd - fetchStart);

    console.log(`[fetcher] 📥 Response received in ${fetchDuration}ms:`, {
      url,
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const parseStart = performance.now();
    const data = await response.json();
    const parseEnd = performance.now();
    const parseDuration = Math.round(parseEnd - parseStart);
    const totalDuration = Math.round(parseEnd - fetchStart);

    console.log(`[fetcher] ✅ Data parsed in ${parseDuration}ms (total: ${totalDuration}ms):`, {
      url,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
    });

    return data;
  } catch (error) {
    const errorTime = performance.now();
    const duration = Math.round(errorTime - fetchStart);
    console.error(`[fetcher] ❌ Fetch failed after ${duration}ms:`, {
      url,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

// Writing page hooks
export function useUserStories() {
  return usePersistedSWR(
    '/writing/api/stories',
    fetcher,
    CACHE_CONFIGS.writing,
    {
      revalidateOnFocus: false, // Optimized: Don't revalidate on tab focus for better performance
      revalidateOnReconnect: true,
      refreshInterval: 10 * 60 * 1000, // Optimized: Refresh every 10 minutes instead of default
      dedupingInterval: 60 * 1000, // Optimized: Extended to 1 minute for better deduplication
      // staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes before considering stale
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onSuccess: (data) => {
        console.log('✅ User stories loaded successfully:', data?.stories?.length || 0, 'stories');
      },
      onError: (error) => {
        console.error('❌ User stories fetch failed:', error);
      }
    }
  );
}

export function useStoryDrafts() {
  return usePersistedSWR(
    '/writing/api/stories/drafts',
    fetcher,
    CACHE_CONFIGS.writing,
    {
      revalidateOnFocus: true,
      errorRetryCount: 2,
      onSuccess: (data) => {
        console.log('✅ Drafts loaded successfully:', data?.drafts?.length || 0, 'drafts');
      }
    }
  );
}

export function useStoryStats(storyId: string | null) {
  return usePersistedSWR(
    storyId ? `/writing/api/stories/${storyId}/stats` : null,
    fetcher,
    CACHE_CONFIGS.analytics,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // Refresh every minute for stats
      errorRetryCount: 2
    }
  );
}

// Reading page hooks
export function usePublishedStories() {
  const hookStartTime = performance.now();
  console.log(`[usePublishedStories] 🎣 Hook called at ${new Date().toISOString()}`);

  const result = usePersistedSWR(
    '/reading/api/published',
    fetcher,
    CACHE_CONFIGS.reading,
    {
      revalidateOnFocus: false, // Optimized: Don't revalidate on tab focus since data is static
      revalidateOnReconnect: true,
      refreshInterval: 30 * 60 * 1000, // Optimized: Refresh every 30 minutes (published stories don't change frequently)
      dedupingInterval: 30 * 60 * 1000, // ⚡ OPTIMIZED: 30 minutes - keeps story list in SWR memory cache for extended browsing sessions
      keepPreviousData: true, // ⚡ OPTIMIZED: Keep previous data in memory when navigating
      // staleTime: 15 * 60 * 1000, // Keep data fresh for 15 minutes before considering stale
      onSuccess: (data, key) => {
        const hookEndTime = performance.now();
        const totalHookTime = Math.round(hookEndTime - hookStartTime);

        const source = data?.fromCache ? 'localStorage cache' : 'API fetch';
        const storiesCount = data?.stories?.length || 0;
        const totalCount = data?.count || 0;

        console.log(`[usePublishedStories] ✅ Stories loaded from ${source} in ${totalHookTime}ms:`, {
          storiesCount,
          totalCount,
          fromCache: data?.fromCache,
          key,
          cacheConfig: {
            ttl: '1 hour',
            version: CACHE_CONFIGS.reading.version,
            compress: CACHE_CONFIGS.reading.compress,
          },
        });

        // Log story details for debugging
        if (storiesCount > 0) {
          console.log(`[usePublishedStories] 📚 Story list details:`, {
            firstStory: data.stories[0]?.title,
            lastStory: data.stories[storiesCount - 1]?.title,
            genres: [...new Set(data.stories.map((s: any) => s.genre))],
            totalWordCount: data.stories.reduce((sum: number, s: any) => sum + (s.wordCount || 0), 0),
          });
        }
      },
      onError: (error, key) => {
        const hookEndTime = performance.now();
        const totalHookTime = Math.round(hookEndTime - hookStartTime);

        console.error(`[usePublishedStories] ❌ Fetch failed after ${totalHookTime}ms:`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          key,
        });
      },
      onLoadingSlow: (key) => {
        console.warn(`[usePublishedStories] ⏳ Loading is taking longer than expected for: ${key}`);
      },
    }
  );

  const { data, error, isLoading, isValidating } = result;

  // Log hook state on every call
  console.log(`[usePublishedStories] 📊 Hook state:`, {
    isLoading,
    isValidating,
    hasData: !!data,
    hasError: !!error,
    storiesCount: data?.stories?.length || 0,
    fromCache: data?.fromCache,
  });

  return result;
}

export function useFeaturedStories() {
  return usePersistedSWR(
    '/reading/api/stories/featured',
    fetcher,
    CACHE_CONFIGS.reading,
    {
      revalidateOnFocus: false,
      refreshInterval: 10 * 60 * 1000, // Refresh every 10 minutes
      // staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
      onSuccess: (data) => {
        console.log('✅ Featured stories loaded:', data?.stories?.length || 0, 'featured');
      }
    }
  );
}

export function useGenreStories(genre: string | null) {
  return usePersistedSWR(
    genre ? `/reading/api/stories/genre/${genre}` : null,
    fetcher,
    CACHE_CONFIGS.reading,
    {
      revalidateOnFocus: false,
      refreshInterval: 10 * 60 * 1000,
      keepPreviousData: true
    }
  );
}

// Community page hooks (optimized)
export function useCommunityStories() {
  return usePersistedSWR(
    '/community/api/stories',
    fetcher,
    CACHE_CONFIGS.community,
    {
      revalidateOnFocus: false, // Optimized: Don't revalidate on tab focus for better performance
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // Optimized: Refresh every 5 minutes instead of 30 seconds
      dedupingInterval: 30 * 1000, // Optimized: Extended to 30 seconds for better deduplication
      // staleTime: 2 * 60 * 1000, // Keep data fresh for 2 minutes before considering stale
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onSuccess: (data) => {
        console.log('✅ Community data loaded successfully:', data?.stories?.length || 0, 'stories');
      },
      onError: (error) => {
        console.error('❌ Community data fetch failed:', error);
      }
    }
  );
}

export function useCommunityStats() {
  return usePersistedSWR(
    '/community/api/stats',
    fetcher,
    CACHE_CONFIGS.community,
    {
      revalidateOnFocus: false,
      refreshInterval: 60 * 1000, // Refresh every minute
      // staleTime: 30 * 1000
    }
  );
}

export function useStoryDiscussion(storyId: string | null) {
  return usePersistedSWR(
    storyId ? `/community/api/story/${storyId}/posts` : null,
    fetcher,
    { ...CACHE_CONFIGS.community, ttl: 1 * 60 * 1000 }, // 1 minute TTL for discussions
    {
      revalidateOnFocus: true,
      refreshInterval: 15 * 1000, // Refresh every 15 seconds for active discussions
      errorRetryCount: 2
    }
  );
}

// Publish page hooks
export function usePublishStatus() {
  return usePersistedSWR(
    '/publish/api/status',
    fetcher,
    CACHE_CONFIGS.publish,
    {
      revalidateOnFocus: true,
      errorRetryCount: 2,
      onSuccess: (data) => {
        console.log('✅ Publish status loaded:', data?.pending || 0, 'pending publications');
      }
    }
  );
}

export function usePublishHistory() {
  return usePersistedSWR(
    '/publish/api/history',
    fetcher,
    CACHE_CONFIGS.publish,
    {
      revalidateOnFocus: false,
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      onSuccess: (data) => {
        console.log('✅ Publish history loaded:', data?.publications?.length || 0, 'publications');
      }
    }
  );
}

export function usePublishAnalytics() {
  return usePersistedSWR(
    '/publish/api/analytics',
    fetcher,
    CACHE_CONFIGS.analytics,
    {
      revalidateOnFocus: false,
      refreshInterval: 2 * 60 * 1000, // Refresh every 2 minutes
      // staleTime: 30 * 1000
    }
  );
}

// Analytics page hooks
export function useStoryAnalytics(timeRange: string = '7d') {
  return usePersistedSWR(
    `/analytics/api/stories?range=${timeRange}`,
    fetcher,
    CACHE_CONFIGS.analytics,
    {
      revalidateOnFocus: true,
      refreshInterval: 30 * 1000, // Refresh every 30 seconds
      dedupingInterval: 10 * 1000, // Dedupe for 10 seconds
      keepPreviousData: true,
      onSuccess: (data) => {
        console.log('✅ Story analytics loaded for', timeRange, ':', data?.totalViews || 0, 'views');
      }
    }
  );
}

export function useReaderAnalytics(timeRange: string = '7d') {
  return usePersistedSWR(
    `/analytics/api/readers?range=${timeRange}`,
    fetcher,
    CACHE_CONFIGS.analytics,
    {
      revalidateOnFocus: false,
      refreshInterval: 60 * 1000, // Refresh every minute
      keepPreviousData: true
    }
  );
}

export function usePerformanceMetrics(storyId: string | null) {
  return usePersistedSWR(
    storyId ? `/analytics/api/performance/${storyId}` : null,
    fetcher,
    CACHE_CONFIGS.analytics,
    {
      revalidateOnFocus: false,
      refreshInterval: 2 * 60 * 1000, // Refresh every 2 minutes
      errorRetryCount: 2
    }
  );
}

// Settings page hooks
export function useUserSettings() {
  return usePersistedSWR(
    '/settings/api/user',
    fetcher,
    CACHE_CONFIGS.settings,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false, // Settings don't need frequent updates
      errorRetryCount: 2,
      onSuccess: (data) => {
        console.log('✅ User settings loaded successfully');
      },
      onError: (error) => {
        console.error('❌ User settings fetch failed:', error);
      }
    }
  );
}

export function usePrivacySettings() {
  return usePersistedSWR(
    '/settings/api/privacy',
    fetcher,
    CACHE_CONFIGS.settings,
    {
      revalidateOnFocus: false,
      errorRetryCount: 2
    }
  );
}

// Global app data hooks
export function useAppStats() {
  return usePersistedSWR(
    '/api/stats',
    fetcher,
    CACHE_CONFIGS.reading,
    {
      revalidateOnFocus: false,
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      // staleTime: 2 * 60 * 1000,
      onSuccess: (data) => {
        console.log('✅ App stats loaded:', data);
      }
    }
  );
}

// Utility hooks for cache management
export function useCacheManagement() {
  const clearAllCache = () => {
    if (typeof window !== 'undefined') {
      const { cacheManager } = require('./use-persisted-swr');
      cacheManager.clearAllCache();
      // Force page refresh to reload data
      window.location.reload();
    }
  };

  const clearPageCache = (pageType: string) => {
    if (typeof window !== 'undefined') {
      const { cacheManager } = require('./use-persisted-swr');
      cacheManager.clearPageCache(pageType);
    }
  };

  const invalidatePageCache = (pageType: string) => {
    if (typeof window !== 'undefined') {
      const { cacheManager } = require('./use-persisted-swr');
      cacheManager.invalidatePageCache(pageType);
    }
  };

  const getCacheStats = () => {
    if (typeof window !== 'undefined') {
      const { cacheManager } = require('./use-persisted-swr');
      return cacheManager.getCacheStats();
    }
    return { totalSize: 0, totalEntries: 0 };
  };

  const preloadPageCache = (pageType: string) => {
    if (typeof window !== 'undefined') {
      const { cacheManager } = require('./use-persisted-swr');
      cacheManager.preloadPageCache(pageType);
    }
  };

  const getCacheHealth = (pageType: string) => {
    if (typeof window !== 'undefined') {
      const { cacheManager } = require('./use-persisted-swr');
      return cacheManager.getCacheHealth(pageType);
    }
    return 'unknown';
  };

  return {
    clearAllCache,
    clearPageCache,
    invalidatePageCache,
    getCacheStats,
    preloadPageCache,
    getCacheHealth
  };
}
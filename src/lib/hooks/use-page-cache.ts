'use client';

import { usePersistedSWR, CACHE_CONFIGS } from './use-persisted-swr';

// Shared fetcher function
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

// Writing page hooks
export function useUserStories() {
  return usePersistedSWR(
    '/api/stories',
    fetcher,
    CACHE_CONFIGS.writing,
    {
      revalidateOnFocus: false, // Optimized: Don't revalidate on tab focus for better performance
      revalidateOnReconnect: true,
      refreshInterval: 10 * 60 * 1000, // Optimized: Refresh every 10 minutes instead of default
      dedupingInterval: 60 * 1000, // Optimized: Extended to 1 minute for better deduplication
      staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes before considering stale
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
    '/api/stories/drafts',
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
    storyId ? `/api/stories/${storyId}/stats` : null,
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
  return usePersistedSWR(
    '/api/stories/published',
    fetcher,
    CACHE_CONFIGS.reading,
    {
      revalidateOnFocus: false, // Optimized: Don't revalidate on tab focus since data is static
      revalidateOnReconnect: true,
      refreshInterval: 15 * 60 * 1000, // Optimized: Refresh every 15 minutes instead of 5
      dedupingInterval: 2 * 60 * 1000, // Optimized: Extended to 2 minutes for better deduplication
      staleTime: 10 * 60 * 1000, // Keep data fresh for 10 minutes before considering stale
      onSuccess: (data) => {
        console.log('✅ Published stories loaded:', data?.stories?.length || 0, 'stories');
      },
      onError: (error) => {
        console.error('❌ Published stories fetch failed:', error);
      }
    }
  );
}

export function useFeaturedStories() {
  return usePersistedSWR(
    '/api/stories/featured',
    fetcher,
    CACHE_CONFIGS.reading,
    {
      revalidateOnFocus: false,
      refreshInterval: 10 * 60 * 1000, // Refresh every 10 minutes
      staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
      onSuccess: (data) => {
        console.log('✅ Featured stories loaded:', data?.stories?.length || 0, 'featured');
      }
    }
  );
}

export function useGenreStories(genre: string | null) {
  return usePersistedSWR(
    genre ? `/api/stories/genre/${genre}` : null,
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
    '/api/community/stories',
    fetcher,
    CACHE_CONFIGS.community,
    {
      revalidateOnFocus: false, // Optimized: Don't revalidate on tab focus for better performance
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // Optimized: Refresh every 5 minutes instead of 30 seconds
      dedupingInterval: 30 * 1000, // Optimized: Extended to 30 seconds for better deduplication
      staleTime: 2 * 60 * 1000, // Keep data fresh for 2 minutes before considering stale
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
    '/api/community/stats',
    fetcher,
    CACHE_CONFIGS.community,
    {
      revalidateOnFocus: false,
      refreshInterval: 60 * 1000, // Refresh every minute
      staleTime: 30 * 1000
    }
  );
}

export function useStoryDiscussion(storyId: string | null) {
  return usePersistedSWR(
    storyId ? `/api/community/story/${storyId}/posts` : null,
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
    '/api/publish/status',
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
    '/api/publish/history',
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
    '/api/publish/analytics',
    fetcher,
    CACHE_CONFIGS.analytics,
    {
      revalidateOnFocus: false,
      refreshInterval: 2 * 60 * 1000, // Refresh every 2 minutes
      staleTime: 30 * 1000
    }
  );
}

// Analytics page hooks
export function useStoryAnalytics(timeRange: string = '7d') {
  return usePersistedSWR(
    `/api/analytics/stories?range=${timeRange}`,
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
    `/api/analytics/readers?range=${timeRange}`,
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
    storyId ? `/api/analytics/performance/${storyId}` : null,
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
    '/api/settings/user',
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

export function useNotificationSettings() {
  return usePersistedSWR(
    '/api/settings/notifications',
    fetcher,
    CACHE_CONFIGS.settings,
    {
      revalidateOnFocus: false,
      errorRetryCount: 2
    }
  );
}

export function usePrivacySettings() {
  return usePersistedSWR(
    '/api/settings/privacy',
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
      staleTime: 2 * 60 * 1000,
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
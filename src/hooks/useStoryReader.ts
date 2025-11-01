'use client';

import { usePersistedSWR, CACHE_CONFIGS } from '@/lib/hooks/use-persisted-swr';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export interface Scene {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  status: string;
}

export interface Chapter {
  id: string;
  title: string;
  content?: string;
  orderIndex: number;
  status: string;
  scenes?: Scene[];
}

export interface Part {
  id: string;
  title: string;
  orderIndex: number;
  chapters: Chapter[];
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  status: string;
  parts: Part[];
  chapters: Chapter[];
  userId: string;
}

export interface StoryReaderResponse {
  story: Story;
  isOwner: boolean;
  metadata: {
    fetchedAt: string;
    totalChapters: number;
    publishedChapters: number;
  };
}

export interface UseStoryReaderReturn {
  story: Story | undefined;
  isOwner: boolean;
  availableChapters: Chapter[];
  isLoading: boolean;
  isValidating: boolean;
  error: any;
  mutate: () => Promise<StoryReaderResponse | undefined>;
  refreshStory: () => Promise<StoryReaderResponse | undefined>;
}

// ETag cache for story data
const storyETagCache = new Map<string, { data: StoryReaderResponse; etag: string; timestamp: number }>();

function getCachedStoryData(url: string) {
  const cached = storyETagCache.get(url);
  if (cached) {
    // Keep ETag cache for 1 hour
    const isExpired = Date.now() - cached.timestamp > 60 * 60 * 1000;
    if (!isExpired) {
      return cached;
    } else {
      storyETagCache.delete(url);
    }
  }
  return null;
}

function cacheStoryData(url: string, data: StoryReaderResponse, etag: string) {
  storyETagCache.set(url, {
    data,
    etag,
    timestamp: Date.now()
  });
  
  // Limit cache size
  if (storyETagCache.size > 20) {
    const oldestKey = storyETagCache.keys().next().value;
    if (oldestKey !== undefined) {
      storyETagCache.delete(oldestKey);
    }
  }
}

// Enhanced fetcher function for story reading data with ETag support
const fetcher = async (url: string): Promise<StoryReaderResponse> => {
  // Get cached ETag from previous request
  const cachedData = getCachedStoryData(url);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (cachedData?.etag) {
    headers['If-None-Match'] = cachedData.etag;
  }

  const res = await fetch(url, {
    credentials: 'include',
    headers,
  });

  // Handle 304 Not Modified - return cached data
  if (res.status === 304 && cachedData?.data) {
    console.log('🎯 Story data unchanged, using cached version');
    return cachedData.data;
  }
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
    (error as any).status = res.status;
    (error as any).info = errorData;
    throw error;
  }
  
  const data = await res.json();
  
  // Cache the data with ETag for next request
  const etag = res.headers.get('ETag');
  if (etag) {
    cacheStoryData(url, data, etag);
  }
  
  return data;
};

/**
 * Custom hook for reading story data with SWR caching
 * Provides cached access to story structure, chapters, and scenes
 */
export function useStoryReader(
  storyId: string | null,
  initialData?: Story | null
): UseStoryReaderReturn {
  const { data: session, status: sessionStatus } = useSession();

  // Only fetch if we have a story ID and session is loaded
  const shouldFetch = storyId && sessionStatus !== 'loading';

  // Transform initial SSR data to match SWR expected format
  const fallbackData = useMemo(() => {
    if (!initialData) return undefined;

    return {
      story: initialData,
      isOwner: session?.user?.id === initialData.userId,
      metadata: {
        fetchedAt: new Date().toISOString(),
        totalChapters: initialData.parts.reduce((sum, part) => sum + part.chapters.length, 0) + initialData.chapters.length,
        publishedChapters: initialData.parts.reduce((sum, part) => sum + part.chapters.filter(ch => ch.status === 'published').length, 0) + initialData.chapters.filter(ch => ch.status === 'published').length
      }
    };
  }, [initialData, session?.user?.id]);

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  } = usePersistedSWR<StoryReaderResponse>(
    shouldFetch ? `/studio/api/stories/${storyId}/read` : null,
    fetcher,
    {
      ...CACHE_CONFIGS.reading, // 1hr TTL + compression
      ttl: 10 * 60 * 1000  // 10min localStorage cache
    },
    {
      fallbackData, // ⚡ SSR data hydration - instant display
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0, // No automatic polling
      dedupingInterval: 30 * 60 * 1000, // ⚡ OPTIMIZED: 30 minutes - keeps story structure in SWR memory cache for extended reading sessions
      keepPreviousData: true, // ⚡ OPTIMIZED: Keep story data in memory when navigating
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onError: (error) => {
        console.error(`Story reader error for ID ${storyId}:`, error);
      },
      onSuccess: (data) => {
        console.log(`Story data cached for: ${data.story.title} (${data.metadata.publishedChapters}/${data.metadata.totalChapters} chapters)`);
      }
    }
  );

  // Calculate available chapters (memoized for performance)
  const availableChapters = useMemo(() => {
    if (!data?.story) return [];

    // Create chapters with part context for proper sorting
    const chaptersWithPartOrder = data.story.parts.flatMap(part =>
      part.chapters.map(chapter => ({
        ...chapter,
        partOrderIndex: part.orderIndex
      }))
    );

    // Add root-level chapters (no part)
    const rootChapters = data.story.chapters.map(chapter => ({
      ...chapter,
      partOrderIndex: 0 // Root chapters come first
    }));

    const allChapters = [...chaptersWithPartOrder, ...rootChapters];

    // Filter to only published chapters (or all if owner)
    const filteredChapters = allChapters.filter(chapter =>
      data.isOwner || chapter.status === 'published'
    );

    // Deduplicate by chapter ID (in case same chapter appears in both parts and root chapters)
    const seenIds = new Set<string>();
    const uniqueChapters = filteredChapters.filter(chapter => {
      if (seenIds.has(chapter.id)) {
        return false;
      }
      seenIds.add(chapter.id);
      return true;
    });

    // Sort by part orderIndex first, then chapter orderIndex within that part
    return uniqueChapters.sort((a, b) => {
      if (a.partOrderIndex !== b.partOrderIndex) {
        return a.partOrderIndex - b.partOrderIndex;
      }
      return a.orderIndex - b.orderIndex;
    });
  }, [data?.story, data?.isOwner]);

  return {
    story: data?.story,
    isOwner: data?.isOwner ?? false,
    availableChapters,
    isLoading: sessionStatus === 'loading' || isLoading,
    isValidating,
    error,
    mutate,
    refreshStory: () => mutate()
  };
}

/**
 * Hook for prefetching story data (useful for link hover preloading)
 */
export function usePrefetchStory() {
  return {
    prefetch: async (storyId: string) => {
      try {
        // Prefetch story data but don't cache it yet
        await fetch(`/studio/api/stories/${storyId}/read`, {
          credentials: 'include',
        });
      } catch (error) {
        // Silently fail for prefetch
        console.debug('Prefetch failed for story:', storyId, error);
      }
    }
  };
}

/**
 * Hook for managing reading position/progress (future enhancement)
 */
export function useReadingProgress(storyId: string, chapterId: string | null) {
  return useMemo(() => ({
    // Placeholder for reading progress tracking
    savePosition: (chapterId: string, scrollPosition: number) => {
      if (typeof window !== 'undefined') {
        const key = `reading-position-${storyId}`;
        const data = {
          chapterId,
          scrollPosition,
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
      }
    },
    getPosition: () => {
      if (typeof window !== 'undefined') {
        const key = `reading-position-${storyId}`;
        const data = localStorage.getItem(key);
        if (data) {
          try {
            return JSON.parse(data);
          } catch {
            return null;
          }
        }
      }
      return null;
    }
  }), [storyId]);
}
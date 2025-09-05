'use client';

import { usePersistedSWR, CACHE_CONFIGS } from '@/lib/hooks/use-persisted-swr';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export interface Scene {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  wordCount: number;
  status: string;
}

export interface Chapter {
  id: string;
  title: string;
  content?: string;
  orderIndex: number;
  wordCount: number;
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
  wordCount?: number;
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

// Fetcher function for story reading data
const fetcher = async (url: string): Promise<StoryReaderResponse> => {
  const res = await fetch(url, {
    // Add credentials for authentication
    credentials: 'include',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
    (error as any).status = res.status;
    (error as any).info = errorData;
    throw error;
  }
  
  return res.json();
};

/**
 * Custom hook for reading story data with SWR caching
 * Provides cached access to story structure, chapters, and scenes
 */
export function useStoryReader(storyId: string | null): UseStoryReaderReturn {
  const { data: session, status: sessionStatus } = useSession();
  
  // Only fetch if we have a story ID and session is loaded
  const shouldFetch = storyId && sessionStatus !== 'loading';
  
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  } = usePersistedSWR<StoryReaderResponse>(
    shouldFetch ? `/api/stories/${storyId}/read` : null,
    fetcher,
    {
      ...CACHE_CONFIGS.reading, // 1hr TTL + compression
      // Override TTL based on story status
      ttl: data?.story?.status === 'published' && !data?.isOwner 
        ? 60 * 60 * 1000  // 1hr for published stories
        : 10 * 60 * 1000  // 10min for drafts/owned stories
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0, // No automatic polling
      dedupingInterval: 30 * 1000, // 30 seconds deduplication
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
    
    const allChapters = [
      ...data.story.parts.flatMap(part => part.chapters),
      ...data.story.chapters
    ];

    // Filter to only published chapters (or all if owner)
    return allChapters.filter(chapter => 
      data.isOwner || chapter.status === 'published'
    );
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
        await fetch(`/api/stories/${storyId}/read`, {
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
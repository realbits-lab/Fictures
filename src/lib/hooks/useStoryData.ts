import { usePersistedSWR, CACHE_CONFIGS } from '@/lib/hooks/use-persisted-swr';
import { useSession } from 'next-auth/react';

interface Story {
  id: string;
  title: string;
  genre: string;
  status: string;
  parts: Array<{
    id: string;
    title: string;
    orderIndex: number;
    chapters: Array<{
      id: string;
      title: string;
      orderIndex: number;
      status: string;
      wordCount: number;
      targetWordCount: number;
      scenes?: Array<{
        id: string;
        title: string;
        status: string;
        wordCount: number;
      }>;
    }>;
  }>;
  chapters: Array<{
    id: string;
    title: string;
    orderIndex: number;
    status: string;
    wordCount: number;
    targetWordCount: number;
    scenes?: Array<{
      id: string;
      title: string;
      status: string;
      wordCount: number;
    }>;
  }>;
}

// Fetcher function for SWR
const fetcher = async (url: string): Promise<Story> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch story data');
  }
  return res.json();
};

// Custom hook for fetching story data with enhanced SWR caching
export function useStoryData(storyId: string | null) {
  const { data: session, status: sessionStatus } = useSession();
  
  // Only fetch if we have a story ID and session is loaded
  const shouldFetch = storyId && sessionStatus !== 'loading';
  
  const { data, error, isLoading, isValidating, mutate } = usePersistedSWR(
    shouldFetch ? `/api/stories/${storyId}/write` : null,
    fetcher,
    {
      ...CACHE_CONFIGS.writing, // 30min TTL with localStorage persistence
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 0, // No automatic polling during writing
      dedupingInterval: 10 * 1000, // 10 seconds deduplication for rapid navigation
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onError: (error) => {
        console.error(`Story data error for ID ${storyId}:`, error);
      },
      onSuccess: (data) => {
        console.log(`Story writing data cached for: ${data?.story?.title}`);
      }
    }
  );

  return {
    story: data?.story,
    isOwner: data?.isOwner ?? false,
    metadata: data?.metadata,
    isLoading: sessionStatus === 'loading' || isLoading,
    isValidating, // Background revalidation indicator
    error,
    mutate, // For manual revalidation
    refreshStory: () => mutate(),
  };
}

// Hook for multiple stories (for sidebar list)
export function useStoriesData(storyIds: string[]) {
  const { data: session, status: sessionStatus } = useSession();
  
  const shouldFetch = storyIds.length > 0 && sessionStatus !== 'loading';
  
  const { data, error, isLoading } = usePersistedSWR(
    shouldFetch ? ['stories', ...storyIds] : null,
    async () => {
      const promises = storyIds.map(id => 
        fetcher(`/api/stories/${id}/write`)
      );
      const results = await Promise.all(promises);
      return results.map(result => result?.story).filter(Boolean);
    },
    {
      ...CACHE_CONFIGS.writing,
      ttl: 10 * 60 * 1000, // 10min TTL for story lists (shorter than individual stories)
    },
    {
      revalidateOnFocus: false, // Don't revalidate all stories on focus
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      dedupingInterval: 30 * 1000, // 30 seconds for story lists
    }
  );

  return {
    stories: data || [],
    isLoading,
    error,
  };
}
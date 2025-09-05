import useSWR from 'swr';

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

// Custom hook for fetching story data with SWR
export function useStoryData(storyId: string | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    storyId ? `/api/stories/${storyId}/structure` : null,
    fetcher,
    {
      // Cache for 5 minutes (300 seconds)
      dedupingInterval: 300000,
      // Revalidate when window regains focus
      revalidateOnFocus: true,
      // Revalidate when network reconnects
      revalidateOnReconnect: true,
      // Retry on error up to 3 times
      errorRetryCount: 3,
      // Retry interval starts at 5s
      errorRetryInterval: 5000,
      // Keep previous data while revalidating
      keepPreviousData: true,
    }
  );

  return {
    story: data,
    isLoading,
    isValidating, // Background revalidation indicator
    error,
    mutate, // For manual revalidation
  };
}

// Hook for multiple stories (for sidebar list)
export function useStoriesData(storyIds: string[]) {
  const { data, error, isLoading } = useSWR(
    storyIds.length > 0 ? ['stories', ...storyIds] : null,
    async () => {
      const promises = storyIds.map(id => 
        fetcher(`/api/stories/${id}/structure`)
      );
      return Promise.all(promises);
    },
    {
      dedupingInterval: 300000,
      revalidateOnFocus: false, // Don't revalidate all stories on focus
      revalidateOnReconnect: true,
      errorRetryCount: 2,
    }
  );

  return {
    stories: data || [],
    isLoading,
    error,
  };
}
import useSWR from 'swr';

interface Story {
  id: string;
  title: string;
  description: string;
  genre: string;
  status: string;
  viewCount: number;
  rating: number;
  currentWordCount: number;
  createdAt: Date;
  author: {
    id: string;
    name: string;
  };
}

interface PublishedStoriesResponse {
  stories: Story[];
  count: number;
}

// Fetcher function for SWR
const fetcher = async (url: string): Promise<PublishedStoriesResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch published stories');
  }
  return res.json();
};

// Custom hook for fetching published stories with SWR
export function usePublishedStories() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    '/api/stories/published',
    fetcher,
    {
      // Cache for 10 minutes (600 seconds) - published content doesn't change often
      dedupingInterval: 600000,
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
    stories: data?.stories || [],
    count: data?.count || 0,
    isLoading,
    isValidating, // Background revalidation indicator
    error,
    mutate, // For manual revalidation
  };
}
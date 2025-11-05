import useSWR from 'swr';
import { useSession } from 'next-auth/react';

// Define the story type based on the API response
export interface Story {
  id: string;
  title: string;
  genre: string;
  parts: {
    completed: number;
    total: number;
  };
  chapters: {
    completed: number;
    total: number;
  };
  readers: number;
  rating: number;
  status: "draft" | "publishing" | "completed" | "published";
  firstChapterId: string | null;
  hnsData: any;
}

interface StoriesResponse {
  stories: Story[];
}

// Fetcher function for SWR
const fetcher = async (url: string): Promise<StoriesResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch stories: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

// Custom hook for managing stories data
export function useStories() {
  const { data: session } = useSession();
  
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  } = useSWR<StoriesResponse>(
    session?.user?.id ? '/studio/api/stories' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0, // Disable automatic refresh
      dedupingInterval: 5000, // Dedupe requests for 5 seconds
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onError: (error) => {
        console.error('Stories fetch error:', error);
      }
    }
  );

  return {
    stories: data?.stories || [],
    isLoading,
    isValidating,
    error,
    mutate,
    // Helper functions
    refreshStories: () => mutate(),
    addStoryOptimistically: (newStory: Story) => {
      // Optimistic update - add story to cache immediately
      mutate(
        (current) => ({
          stories: current ? [newStory, ...current.stories] : [newStory]
        }),
        false // Don't revalidate immediately
      );
    },
    updateStoryOptimistically: (storyId: string, updates: Partial<Story>) => {
      // Optimistic update - update story in cache immediately
      mutate(
        (current) => ({
          stories: current?.stories.map((story) =>
            story.id === storyId ? { ...story, ...updates } : story
          ) || []
        }),
        false // Don't revalidate immediately
      );
    },
    removeStoryOptimistically: (storyId: string) => {
      // Optimistic update - remove story from cache immediately
      mutate(
        (current) => ({
          stories: current?.stories.filter((story) => story.id !== storyId) || []
        }),
        false // Don't revalidate immediately
      );
    }
  };
}
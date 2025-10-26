/**
 * Community Page Caching Hooks
 *
 * Provides SWR + localStorage caching for community pages
 * - useCommunityStory: Fetch story with characters, settings, and stats
 * - useCommunityPosts: Fetch posts with automatic refresh on mutations
 * - useRevalidateCommunityPosts: Manual revalidation helper
 */

import useSWR from 'swr';
import { usePersistedSWR, CACHE_CONFIGS } from './use-persisted-swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Fetch community story data with caching
 *
 * Returns: { story, characters, settings, stats }
 *
 * Caching:
 * - SWR memory cache: 30 minutes
 * - localStorage: 1 hour
 * - Redis (server): 1 hour
 *
 * @param storyId - Story ID to fetch
 */
export function useCommunityStory(storyId: string) {
  return usePersistedSWR(
    `/api/community/stories/${storyId}`,
    fetcher,
    CACHE_CONFIGS.community,
    {
      revalidateOnFocus: false,     // Don't refetch on tab focus
      revalidateOnReconnect: true,  // Refetch on network reconnect
      refreshInterval: 30 * 60 * 1000, // Auto-refresh every 30min
      dedupingInterval: 30 * 60 * 1000, // Dedupe requests for 30min
      keepPreviousData: true,       // Show stale data while revalidating
      onSuccess: (data, key) => {
        console.log(`[useCommunityStory] Cache updated for ${storyId}`);
      },
      onError: (error, key) => {
        console.error(`[useCommunityStory] Error fetching ${storyId}:`, error);
      }
    }
  );
}

/**
 * Fetch community posts with caching
 *
 * Returns: { posts, total }
 *
 * Caching:
 * - SWR memory cache: 30 minutes
 * - localStorage: 1 hour
 * - Redis (server): 1 hour
 *
 * @param storyId - Story ID to fetch posts for
 */
export function useCommunityPosts(storyId: string) {
  return usePersistedSWR(
    `/api/community/stories/${storyId}/posts`,
    fetcher,
    CACHE_CONFIGS.community,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30 * 60 * 1000,
      dedupingInterval: 30 * 60 * 1000,
      keepPreviousData: true,
      onSuccess: (data, key) => {
        console.log(`[useCommunityPosts] Cache updated for ${storyId} (${data?.posts?.length || 0} posts)`);
      },
      onError: (error, key) => {
        console.error(`[useCommunityPosts] Error fetching posts for ${storyId}:`, error);
      }
    }
  );
}

/**
 * Manual revalidation helper for community posts
 *
 * Use this after creating, updating, or deleting posts to refresh the cache.
 *
 * @param storyId - Story ID to revalidate posts for
 * @returns mutate function to trigger revalidation
 *
 * @example
 * const revalidatePosts = useRevalidateCommunityPosts(storyId);
 *
 * // After creating a post
 * await createPost({ ... });
 * await revalidatePosts(); // Refetch posts from API
 */
export function useRevalidateCommunityPosts(storyId: string) {
  const { mutate } = useSWR(`/api/community/stories/${storyId}/posts`);
  return mutate;
}

/**
 * Manual revalidation helper for community story
 *
 * Use this after updating story metadata or publishing/unpublishing.
 *
 * @param storyId - Story ID to revalidate
 * @returns mutate function to trigger revalidation
 */
export function useRevalidateCommunityStory(storyId: string) {
  const { mutate } = useSWR(`/api/community/stories/${storyId}`);
  return mutate;
}

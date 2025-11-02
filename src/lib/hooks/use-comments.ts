'use client';

import { useCallback } from 'react';
import { usePersistedSWR, CACHE_CONFIGS, cacheManager } from './use-persisted-swr';
import { mutate } from 'swr';

export interface Comment {
  id: string;
  content: string;
  userId: string;
  userName: string | null;
  userImage: string | null;
  storyId: string;
  chapterId: string | null;
  sceneId: string | null;
  parentCommentId: string | null;
  depth: number;
  likeCount: number;
  replyCount: number;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  replies?: Comment[];
}

export interface CommentsResponse {
  comments: Comment[];
}

interface UseCommentsOptions {
  storyId: string;
  chapterId?: string;
  sceneId?: string;
}

/**
 * Custom hook for fetching and caching comments with 3-layer optimization:
 * 1. SWR memory cache (30min)
 * 2. localStorage cache (30min)
 * 3. Redis cache on server (10min for public, 3min for private)
 *
 * Features:
 * - Instant load from cache (no flash)
 * - Automatic revalidation
 * - Cache invalidation on mutations
 * - Support for story/chapter/scene level comments
 *
 * Usage:
 * ```tsx
 * const { comments, isLoading, error, invalidate } = useComments({
 *   storyId: 'story_123',
 *   sceneId: 'scene_456'
 * });
 * ```
 */
export function useComments({ storyId, chapterId, sceneId }: UseCommentsOptions) {
  // Build cache key based on scope (story/chapter/scene)
  const getCacheKey = useCallback(() => {
    if (!storyId) return null;

    let key = `/studio/api/stories/${storyId}/comments`;
    const params: string[] = [];

    if (sceneId) {
      params.push(`sceneId=${sceneId}`);
    } else if (chapterId) {
      params.push(`chapterId=${chapterId}`);
    }

    return params.length > 0 ? `${key}?${params.join('&')}` : key;
  }, [storyId, chapterId, sceneId]);

  const cacheKey = getCacheKey();

  // Fetcher function
  const fetcher = useCallback(async (url: string): Promise<CommentsResponse> => {
    console.log(`[useComments] 🔄 Fetching comments from: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'public, max-age=600', // 10min cache for CDN
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[useComments] ✅ Fetched ${data.comments?.length || 0} comments`);

    return data;
  }, []);

  // Use persisted SWR with community cache config (30min TTL)
  const { data, error, isLoading, isValidating, mutate: swrMutate } = usePersistedSWR<CommentsResponse>(
    cacheKey,
    fetcher,
    CACHE_CONFIGS.community, // 30min TTL, version 1.1.0
    {
      revalidateOnFocus: false, // Don't revalidate on window focus (comments don't change often)
      revalidateOnReconnect: true, // Revalidate when reconnecting
      dedupingInterval: 10000, // Dedupe requests within 10 seconds
    }
  );

  // Cache invalidation for mutations
  const invalidate = useCallback(async () => {
    console.log(`[useComments] 🔄 Invalidating cache for: ${cacheKey}`);

    // Clear both SWR memory cache and localStorage cache
    if (cacheKey) {
      cacheManager.clearCachedData(cacheKey);
      await swrMutate();
    }
  }, [cacheKey, swrMutate]);

  // Optimistic update for new comment
  const addOptimisticComment = useCallback((newComment: Comment) => {
    if (!cacheKey) return;

    swrMutate(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          comments: [newComment, ...current.comments],
        };
      },
      { revalidate: false }
    );
  }, [cacheKey, swrMutate]);

  // Optimistic update for comment deletion
  const removeOptimisticComment = useCallback((commentId: string) => {
    if (!cacheKey) return;

    swrMutate(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          comments: current.comments.filter(c => c.id !== commentId),
        };
      },
      { revalidate: false }
    );
  }, [cacheKey, swrMutate]);

  // Optimistic update for comment edit
  const updateOptimisticComment = useCallback((commentId: string, updates: Partial<Comment>) => {
    if (!cacheKey) return;

    swrMutate(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          comments: current.comments.map(c =>
            c.id === commentId ? { ...c, ...updates, isEdited: true } : c
          ),
        };
      },
      { revalidate: false }
    );
  }, [cacheKey, swrMutate]);

  return {
    comments: data?.comments || [],
    isLoading,
    isValidating,
    error,
    invalidate,
    addOptimisticComment,
    removeOptimisticComment,
    updateOptimisticComment,
  };
}

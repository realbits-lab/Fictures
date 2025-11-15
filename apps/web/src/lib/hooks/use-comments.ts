"use client";

import { useCallback, useState } from "react";
import {
    CACHE_CONFIGS,
    cacheManager,
    usePersistedSWR,
} from "./use-persisted-swr";

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
    dislikeCount: number;
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
export function useComments({
    storyId,
    chapterId,
    sceneId,
}: UseCommentsOptions) {
    // Build cache key based on scope (story/chapter/scene)
    const getCacheKey = useCallback(() => {
        if (!storyId) return null;

        const key = `/api/studio/story/${storyId}/comments`;
        const params: string[] = [];

        if (sceneId) {
            params.push(`sceneId=${sceneId}`);
        } else if (chapterId) {
            params.push(`chapterId=${chapterId}`);
        }

        return params.length > 0 ? `${key}?${params.join("&")}` : key;
    }, [storyId, chapterId, sceneId]);

    const cacheKey = getCacheKey();

    // Store ETag in memory for conditional requests
    const [etag, setETag] = useState<string | null>(null);

    // Fetcher function with ETag support
    const fetcher = useCallback(
        async (url: string): Promise<CommentsResponse | undefined> => {
            console.log(`[useComments] 🔄 Fetching comments from: ${url}`);

            const headers: HeadersInit = {
                "Cache-Control": "public, max-age=600", // 10min cache for CDN
            };

            // Add If-None-Match header if we have an ETag from previous response
            if (etag) {
                headers["If-None-Match"] = etag;
                console.log(`[useComments] 📋 Sending ETag: ${etag}`);
            }

            const response = await fetch(url, { headers });

            // Handle 304 Not Modified - return undefined to keep using cached data
            if (response.status === 304) {
                console.log(
                    `[useComments] ✅ 304 Not Modified - using cached data`,
                );
                // Return undefined to tell SWR to keep current data
                return undefined;
            }

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch comments: ${response.statusText}`,
                );
            }

            // Store new ETag for next request
            const newETag = response.headers.get("ETag");
            if (newETag) {
                setETag(newETag);
                console.log(`[useComments] 📝 Stored new ETag: ${newETag}`);
            }

            const data = await response.json();
            console.log(
                `[useComments] ✅ Fetched ${data.comments?.length || 0} comments`,
            );

            return data;
        },
        [etag],
    );

    // Use persisted SWR with community cache config (30min TTL)
    const {
        data,
        error,
        isLoading,
        isValidating,
        mutate: swrMutate,
    } = usePersistedSWR<CommentsResponse>(
        cacheKey,
        fetcher as (url: string) => Promise<CommentsResponse>,
        CACHE_CONFIGS.community, // 30min TTL, version 1.1.0
        {
            revalidateOnFocus: false, // Don't revalidate on window focus (comments don't change often)
            revalidateOnReconnect: true, // Revalidate when reconnecting
            dedupingInterval: 10000, // Dedupe requests within 10 seconds
            keepPreviousData: true, // Keep showing previous data when fetcher returns undefined (304 case)
        },
    );

    // Cache invalidation for mutations
    const invalidate = useCallback(async () => {
        console.log(`[useComments] 🔄 Invalidating cache for: ${cacheKey}`);

        // Clear both SWR memory cache and localStorage cache
        if (cacheKey) {
            cacheManager.clearCachedData(cacheKey);
            // Clear ETag so next request fetches fresh data
            setETag(null);
            await swrMutate();
        }
    }, [cacheKey, swrMutate]);

    // Optimistic update for new comment
    const addOptimisticComment = useCallback(
        (newComment: Comment) => {
            if (!cacheKey) return;

            swrMutate(
                (current) => {
                    if (!current) return current;
                    return {
                        ...current,
                        comments: [newComment, ...current.comments],
                    };
                },
                { revalidate: false },
            );
        },
        [cacheKey, swrMutate],
    );

    // Optimistic update for comment deletion
    const removeOptimisticComment = useCallback(
        (commentId: string) => {
            if (!cacheKey) return;

            swrMutate(
                (current) => {
                    if (!current) return current;
                    return {
                        ...current,
                        comments: current.comments.filter(
                            (c) => c.id !== commentId,
                        ),
                    };
                },
                { revalidate: false },
            );
        },
        [cacheKey, swrMutate],
    );

    // Optimistic update for comment edit
    const updateOptimisticComment = useCallback(
        (commentId: string, updates: Partial<Comment>) => {
            if (!cacheKey) return;

            swrMutate(
                (current) => {
                    if (!current) return current;
                    return {
                        ...current,
                        comments: current.comments.map((c) =>
                            c.id === commentId
                                ? { ...c, ...updates, isEdited: true }
                                : c,
                        ),
                    };
                },
                { revalidate: false },
            );
        },
        [cacheKey, swrMutate],
    );

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

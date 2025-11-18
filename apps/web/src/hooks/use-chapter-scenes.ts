"use client";

import { useSession } from "next-auth/react";
import { CACHE_CONFIGS, usePersistedSWR, type CacheConfig } from "@/hooks/use-persisted-swr";

export interface Scene {
    id: string;
    title: string;
    content: string;
    orderIndex: number;
    status: string;
    imageUrl?: string | null;
    imageVariants?: any;
    sceneImage?: {
        url?: string;
        prompt?: string;
        style?: string;
        mood?: string;
        generated_at?: string;
    };
}

export interface ChapterScenesResponse {
    scenes: Scene[];
    metadata: {
        fetchedAt: string;
        chapterId: string;
        totalScenes: number;
    };
}

// Enhanced fetcher with ETag support
const fetcher = async (url: string): Promise<ChapterScenesResponse> => {
    const fetchStartTime = performance.now();
    const chapterId = url.split("/").slice(-2)[0]; // Extract chapter ID from URL
    const fetchId = Math.random().toString(36).substring(7);

    console.log(`[${fetchId}] SWR Fetcher START for chapter: ${chapterId}`);

    // Get cached ETag from previous request
    const cachedData = getCachedSceneData(url);
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (cachedData?.etag) {
        headers["If-None-Match"] = cachedData.etag;
        console.log(
            `[${fetchId}] Using ETag: ${cachedData.etag.substring(0, 8)}...`,
        );
    }

    const networkStartTime = performance.now();
    const res = await fetch(url, {
        credentials: "include",
        headers,
    });
    const networkDuration = performance.now() - networkStartTime;
    console.log(
        `[${fetchId}] Network request completed: ${networkDuration.toFixed(2)}ms (Status: ${res.status})`,
    );

    // Handle 304 Not Modified - return cached data
    if (res.status === 304 && cachedData?.data) {
        const totalDuration = performance.now() - fetchStartTime;
        console.log(
            `[${fetchId}] 304 Not Modified - Using ETag cache (Total: ${totalDuration.toFixed(2)}ms)`,
        );
        return cachedData.data;
    }

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const error = new Error(
            errorData.error || `HTTP ${res.status}: ${res.statusText}`,
        );
        (error as any).status = res.status;
        (error as any).info = errorData;
        const totalDuration = performance.now() - fetchStartTime;
        console.error(
            `[${fetchId}] Fetch failed after ${totalDuration.toFixed(2)}ms:`,
            error.message,
        );
        throw error;
    }

    const parseStartTime = performance.now();
    const data = await res.json();
    const parseDuration = performance.now() - parseStartTime;
    console.log(`[${fetchId}] JSON parsing: ${parseDuration.toFixed(2)}ms`);

    // Cache the data with ETag for next request
    const etag = res.headers.get("ETag");
    if (etag) {
        cacheSceneData(url, data, etag);
        console.log(
            `[${fetchId}] Cached with ETag: ${etag.substring(0, 8)}...`,
        );
    }

    const totalDuration = performance.now() - fetchStartTime;
    console.log(
        `[${fetchId}] Fetch completed: ${totalDuration.toFixed(2)}ms (${data.scenes?.length || 0} scenes)`,
    );
    console.log(
        `[${fetchId}] Breakdown: Network=${networkDuration.toFixed(0)}ms, Parse=${parseDuration.toFixed(0)}ms`,
    );

    return data;
};

// Simple ETag cache for scene data
const sceneETagCache = new Map<
    string,
    { data: ChapterScenesResponse; etag: string; timestamp: number }
>();

function getCachedSceneData(url: string) {
    const cached = sceneETagCache.get(url);
    if (cached) {
        // Keep ETag cache for 1 hour
        const isExpired = Date.now() - cached.timestamp > 60 * 60 * 1000;
        if (!isExpired) {
            return cached;
        } else {
            sceneETagCache.delete(url);
        }
    }
    return null;
}

function cacheSceneData(
    url: string,
    data: ChapterScenesResponse,
    etag: string,
) {
    sceneETagCache.set(url, {
        data,
        etag,
        timestamp: Date.now(),
    });

    // Limit cache size
    if (sceneETagCache.size > 50) {
        const oldestKey = sceneETagCache.keys().next().value;
        if (oldestKey !== undefined) {
            sceneETagCache.delete(oldestKey);
        }
    }
}

/**
 * Hook for fetching individual chapter scenes on-demand
 */
export function useChapterScenes(chapterId: string | null) {
    const { data: session, status: sessionStatus } = useSession();

    const shouldFetch = chapterId && sessionStatus !== "loading";

    const { data, error, isLoading, isValidating, mutate } =
        usePersistedSWR<ChapterScenesResponse>(
            shouldFetch ? `/api/studio/chapters/${chapterId}/scenes` : null,
            fetcher,
            {
                ...CACHE_CONFIGS.novels,
                ttl: 5 * 60 * 1000, // 5min localStorage cache for scenes
                revalidateOnFocus: false,
                revalidateOnReconnect: true,
                refreshInterval: 0,
                dedupingInterval: 30 * 60 * 1000, // OPTIMIZED: 30 minutes - keeps scene data in SWR memory cache for extended reading sessions
                keepPreviousData: true, // OPTIMIZED: Keep previous scene data in memory when navigating between scenes
                errorRetryCount: 3,
                errorRetryInterval: 1000,
                onError: (error: any) => {
                    console.error(
                        `Chapter scenes error for ID ${chapterId}:`,
                        error,
                    );
                },
                onSuccess: (data: ChapterScenesResponse) => {
                    console.log(
                        `Chapter scenes loaded: ${data.scenes.length} scenes for chapter ${chapterId}`,
                    );
                },
            } as CacheConfig,
        );

    // Sort scenes by orderIndex to ensure correct reading order
    const sortedScenes = data?.scenes
        ? [...data.scenes].sort((a, b) => a.orderIndex - b.orderIndex)
        : [];

    return {
        scenes: sortedScenes,
        isLoading: sessionStatus === "loading" || isLoading,
        isValidating,
        error,
        mutate,
        refreshScenes: () => mutate(),
    };
}

/**
 * Community Cache Hook
 * Provides client-side caching for community data
 */

import { useEffect, useState } from "react";

export function useCommunityCache<T>(key: string, defaultValue: T) {
    const [data, setData] = useState<T>(defaultValue);

    useEffect(() => {
        // Check if we're in the browser
        if (typeof window !== "undefined") {
            const cached = sessionStorage.getItem(`community:${key}`);
            if (cached) {
                try {
                    setData(JSON.parse(cached));
                } catch (error) {
                    console.error(
                        "Failed to parse cached community data:",
                        error,
                    );
                }
            }
        }
    }, [key]);

    const updateCache = (newData: T) => {
        setData(newData);
        if (typeof window !== "undefined") {
            sessionStorage.setItem(`community:${key}`, JSON.stringify(newData));
        }
    };

    const clearCache = () => {
        setData(defaultValue);
        if (typeof window !== "undefined") {
            sessionStorage.removeItem(`community:${key}`);
        }
    };

    return { data, updateCache, clearCache };
}

/**
 * Hook for fetching community story details
 */
export function useCommunityStory(storyId: string) {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchStory = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(
                    `/api/community/stories/${storyId}`,
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch community story");
                }

                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err
                        : new Error("Failed to load community story"),
                );
            } finally {
                setIsLoading(false);
            }
        };

        if (storyId) {
            fetchStory();
        }
    }, [storyId]);

    return { data, error, isLoading };
}

/**
 * Hook for fetching community posts
 */
export function useCommunityPosts(storyId: string) {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(
                    `/api/community/stories/${storyId}/posts`,
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch community posts");
                }

                const result = await response.json();
                setData(result.posts || []);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err
                        : new Error("Failed to load community posts"),
                );
            } finally {
                setIsLoading(false);
            }
        };

        if (storyId) {
            fetchPosts();
        }
    }, [storyId]);

    return { data, error, isLoading };
}

/**
 * Hook for revalidating community posts
 */
export function useRevalidateCommunityPosts() {
    const revalidate = async (storyId: string) => {
        try {
            const response = await fetch(
                `/api/community/stories/${storyId}/posts`,
            );
            if (response.ok) {
                return await response.json();
            }
        } catch (err) {
            console.error("Failed to revalidate community posts:", err);
        }
        return null;
    };

    return { revalidate };
}

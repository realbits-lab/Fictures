/**
 * Persisted SWR Hook
 * SWR wrapper with localStorage persistence
 */

import { useEffect } from "react";
import useSWR, { type SWRConfiguration } from "swr";

export interface CacheConfig extends SWRConfiguration {
    ttl?: number;
    version?: string;
}

export const CACHE_CONFIGS = {
    studio: {
        // Story creation/editing (GNB: Studio)
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 10 * 1000, // 10 seconds
        ttl: 30 * 60 * 1000, // 30 minutes
        version: "1.0.0",
    } as CacheConfig,
    novels: {
        // Text-based reading (GNB: Novels)
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 30 * 60 * 1000, // 30 minutes
        ttl: 5 * 60 * 1000, // 5 minutes
        version: "1.0.0",
    } as CacheConfig,
    comics: {
        // Image-based reading (GNB: Comics)
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 60 * 60 * 1000, // 1 hour - images are immutable
        ttl: 30 * 60 * 1000, // 30 minutes - longer for image data
        version: "1.0.0",
    } as CacheConfig,
    community: {
        // Comments and discussions (GNB: Community)
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 5 * 1000, // 5 seconds
        ttl: 30 * 60 * 1000, // 30 minutes
        version: "1.1.0",
    } as CacheConfig,
};

export const cacheManager = {
    get: (key: string) => {
        if (typeof window === "undefined") return null;
        try {
            const item = localStorage.getItem(`swr:${key}`);
            return item ? JSON.parse(item) : null;
        } catch {
            return null;
        }
    },
    set: (key: string, value: unknown) => {
        if (typeof window === "undefined") return;
        try {
            localStorage.setItem(`swr:${key}`, JSON.stringify(value));
        } catch (error) {
            console.error("Failed to cache data:", error);
        }
    },
    remove: (key: string) => {
        if (typeof window === "undefined") return;
        try {
            localStorage.removeItem(`swr:${key}`);
        } catch (error) {
            console.error("Failed to remove cache:", error);
        }
    },
};

export function usePersistedSWR<T>(
    key: string | null,
    fetcher: ((key: string) => Promise<T>) | null,
    config?: CacheConfig,
) {
    const { data, error, mutate, isValidating } = useSWR<T>(key, fetcher, config);

    useEffect(() => {
        if (data && key && typeof window !== "undefined") {
            try {
                localStorage.setItem(`swr:${key}`, JSON.stringify(data));
            } catch (error) {
                console.error("Failed to persist SWR data:", error);
            }
        }
    }, [data, key]);

    return { data, error, mutate, isLoading: !data && !error, isValidating: isValidating ?? false };
}

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
    writing: {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 10 * 1000, // 10 seconds
        ttl: 30 * 60 * 1000, // 30 minutes
        version: "1.0.0",
    } as CacheConfig,
    community: {
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
    config?: SWRConfiguration,
) {
    const { data, error, mutate } = useSWR<T>(key, fetcher, config);

    useEffect(() => {
        if (data && key && typeof window !== "undefined") {
            try {
                localStorage.setItem(`swr:${key}`, JSON.stringify(data));
            } catch (error) {
                console.error("Failed to persist SWR data:", error);
            }
        }
    }, [data, key]);

    return { data, error, mutate, isLoading: !data && !error };
}

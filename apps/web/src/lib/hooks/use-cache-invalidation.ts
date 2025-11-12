/**
 * Cache Invalidation Hook
 * Provides cache invalidation functionality
 */

import { useCallback } from "react";

export function useCacheInvalidation() {
    const invalidate = useCallback((cacheKey: string) => {
        if (typeof window !== "undefined") {
            // Remove from localStorage
            const keys = Object.keys(localStorage);
            keys.forEach((key) => {
                if (key.includes(cacheKey)) {
                    localStorage.removeItem(key);
                }
            });

            // Remove from sessionStorage
            const sessionKeys = Object.keys(sessionStorage);
            sessionKeys.forEach((key) => {
                if (key.includes(cacheKey)) {
                    sessionStorage.removeItem(key);
                }
            });

            console.log(`Cache invalidated for key: ${cacheKey}`);
        }
    }, []);

    const invalidateAll = useCallback(() => {
        if (typeof window !== "undefined") {
            localStorage.clear();
            sessionStorage.clear();
            console.log("All caches invalidated");
        }
    }, []);

    return { invalidate, invalidateAll };
}

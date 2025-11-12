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

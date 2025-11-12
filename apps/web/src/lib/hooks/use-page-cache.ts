/**
 * Page Cache Hook
 * Provides client-side caching for page data
 */

import { useEffect, useState } from "react";

export function usePageCache<T>(key: string, defaultValue: T) {
    const [data, setData] = useState<T>(defaultValue);

    useEffect(() => {
        // Check if we're in the browser
        if (typeof window !== "undefined") {
            const cached = localStorage.getItem(key);
            if (cached) {
                try {
                    setData(JSON.parse(cached));
                } catch (error) {
                    console.error("Failed to parse cached data:", error);
                }
            }
        }
    }, [key]);

    const updateCache = (newData: T) => {
        setData(newData);
        if (typeof window !== "undefined") {
            localStorage.setItem(key, JSON.stringify(newData));
        }
    };

    const clearCache = () => {
        setData(defaultValue);
        if (typeof window !== "undefined") {
            localStorage.removeItem(key);
        }
    };

    return { data, updateCache, clearCache };
}

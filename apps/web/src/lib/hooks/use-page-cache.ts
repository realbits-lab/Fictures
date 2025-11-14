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

/**
 * Hook for fetching published stories for comics browsing
 */
export function usePublishedStories() {
    const [stories, setStories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStories = async () => {
            try {
                setLoading(true);
                const response = await fetch("/api/comics/published");

                if (!response.ok) {
                    throw new Error("Failed to fetch published stories");
                }

                const data = await response.json();
                setStories(data.stories || []);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load stories",
                );
            } finally {
                setLoading(false);
            }
        };

        fetchStories();
    }, []);

    return { stories, loading, error };
}

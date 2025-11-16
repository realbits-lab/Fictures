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

/**
 * Hook for fetching community stories
 */
export function useCommunityStories() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        const fetchStories = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("/api/community/stories");

                if (!response.ok) {
                    throw new Error("Failed to fetch community stories");
                }

                const result = await response.json();
                setData(result.stories || []);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err
                        : new Error("Failed to load community stories"),
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchStories();
    }, []);

    return { data, error, isLoading, isValidating };
}

/**
 * Hook for fetching user stories
 */
export function useUserStories() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        const fetchStories = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("/studio/api/stories");

                if (!response.ok) {
                    throw new Error("Failed to fetch user stories");
                }

                const result = await response.json();
                setData(result.stories || []);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err
                        : new Error("Failed to load user stories"),
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchStories();
    }, []);

    return { data, error, isLoading, isValidating };
}

/**
 * Hook for fetching user settings
 */
export function useUserSettings() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("/api/settings/user");

                if (!response.ok) {
                    throw new Error("Failed to fetch user settings");
                }

                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err
                        : new Error("Failed to load user settings"),
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    return { data, error, isLoading, isValidating };
}

/**
 * Hook for fetching privacy settings
 */
export function usePrivacySettings() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("/api/settings/privacy");

                if (!response.ok) {
                    throw new Error("Failed to fetch privacy settings");
                }

                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err
                        : new Error("Failed to load privacy settings"),
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    return { data, error, isLoading, isValidating };
}

/**
 * Hook for fetching publish status
 */
export function usePublishStatus() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("/api/publish/status");

                if (!response.ok) {
                    throw new Error("Failed to fetch publish status");
                }

                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err
                        : new Error("Failed to load publish status"),
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatus();
    }, []);

    return { data, error, isLoading, isValidating };
}

/**
 * Hook for cache management
 */
export function useCacheManagement() {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("/studio/api/cache/metrics");

                if (response.ok) {
                    const result = await response.json();
                    setStats(result);
                }
            } catch (err) {
                console.error("Failed to load cache stats:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, isLoading };
}

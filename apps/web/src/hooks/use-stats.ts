import { useSession } from "next-auth/react";
import useSWR from "swr";

// Define stats interface
export interface UserStats {
    totalStories: number;
    totalWords: number;
    totalReaders: number;
    avgRating: number;
    isAuthenticated: boolean;
    userName?: string;
}

// Fetcher function for SWR
const fetcher = async (url: string): Promise<UserStats> => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(
            `Failed to fetch stats: ${res.status} ${res.statusText}`,
        );
    }
    return res.json();
};

// Custom hook for managing user stats
export function useStats() {
    const { data: session, status } = useSession();

    const { data, error, isLoading, isValidating, mutate } = useSWR<UserStats>(
        // Only fetch if session is loaded (not loading state)
        status !== "loading" ? "/api/analysis/stats" : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            refreshInterval: 30000, // Refresh every 30 seconds for stats
            dedupingInterval: 10000, // Dedupe requests for 10 seconds
            errorRetryCount: 3,
            errorRetryInterval: 1000,
            onError: (error) => {
                console.error("Stats fetch error:", error);
            },
        },
    );

    return {
        stats: data,
        isLoading: status === "loading" || isLoading,
        isValidating,
        error,
        refreshStats: () => mutate(),
        // Helper function to update stats optimistically after actions
        updateStatsOptimistically: (updates: Partial<UserStats>) => {
            mutate(
                (current) => (current ? { ...current, ...updates } : undefined),
                false, // Don't revalidate immediately
            );
        },
    };
}

"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import {
    BackgroundValidationIndicator,
    StoryGridSkeleton,
    StoryLoadingError,
} from "@/components/common";
import { SkeletonLoader } from "@/components/ui";
import { usePublishedStories } from "@/hooks/use-page-cache";
import { StoryGrid } from "./StoryGrid";

export function BrowseClient() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const { stories, loading, error } = usePublishedStories();
    const [showCacheInfo, setShowCacheInfo] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);

    // Determine page type from pathname
    const pageType = pathname?.startsWith("/novels")
        ? "novels"
        : pathname?.startsWith("/comics")
          ? "comics"
          : "reading";

    // Performance tracking
    const mountTimeRef = useRef<number>(Date.now());
    const firstDataTimeRef = useRef<number | null>(null);
    const renderCountRef = useRef<number>(0);

    const isLoading = loading;
    const isValidating = false; // Hook doesn't support background validation
    const count = stories.length;
    const cacheHealth = "unknown" as "fresh" | "stale" | "expired" | "unknown"; // Hook doesn't provide cache metadata

    // Mock mutate function for retry
    const mutate = () => window.location.reload();

    // Fix hydration mismatch by ensuring first render matches server
    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Track component lifecycle
    useEffect(() => {
        const mountTime = mountTimeRef.current;
        console.log(
            `[BrowseClient] 🎬 Component mounted at ${new Date().toISOString()}`,
        );
        console.log(`[BrowseClient] 📊 Initial state:`, {
            isLoading,
            isValidating,
            hasData: stories.length > 0,
            storiesCount: stories.length,
            hasError: !!error,
        });

        return () => {
            const totalTime = Date.now() - mountTime;
            console.log(
                `[BrowseClient] 👋 Component unmounted after ${totalTime}ms`,
            );
        };
    }, [error, isLoading, isValidating, stories.length]);

    // Track data loading stages
    useEffect(() => {
        renderCountRef.current++;
        const renderNum = renderCountRef.current;
        const timeSinceMount = Date.now() - mountTimeRef.current;

        console.log(
            `[BrowseClient] 🔄 Render #${renderNum} (${timeSinceMount}ms since mount):`,
            {
                isLoading,
                isValidating,
                storiesCount: stories.length,
                hasError: !!error,
            },
        );

        // Track first data appearance
        if (stories.length > 0 && !firstDataTimeRef.current) {
            firstDataTimeRef.current = Date.now();
            const timeToFirstData =
                firstDataTimeRef.current - mountTimeRef.current;
            console.log(
                `[BrowseClient] ⚡ First data appeared in ${timeToFirstData}ms:`,
                {
                    storiesCount: stories.length,
                },
            );
        }

        // Track loading state changes
        if (!isLoading && !isValidating && stories.length > 0) {
            const totalTime = Date.now() - mountTimeRef.current;
            console.log(
                `[BrowseClient] ✅ Loading complete in ${totalTime}ms:`,
                {
                    storiesCount: stories.length,
                    totalCount: count,
                },
            );
        }
    }, [
        isLoading,
        isValidating,
        stories.length,
        error,
        count,
    ]);

    // Track validation cycles
    useEffect(() => {
        if (isValidating && !isLoading) {
            console.log(
                `[BrowseClient] 🔄 Background revalidation started (${stories.length} stories visible)`,
            );
            const startTime = Date.now();

            return () => {
                const duration = Date.now() - startTime;
                console.log(
                    `[BrowseClient] ✅ Background revalidation completed in ${duration}ms`,
                );
            };
        }
    }, [isValidating, isLoading, stories.length]);

    // Track errors
    useEffect(() => {
        if (error) {
            console.error(`[BrowseClient] ❌ Error occurred:`, {
                message: error,
                timeSinceMount: Date.now() - mountTimeRef.current,
                hadPreviousData: stories.length > 0,
            });
        }
    }, [error, stories.length]);

    return (
        <div className="min-h-screen bg-[rgb(var(--color-background))]">
            <div className="container mx-auto px-4 pt-1 pb-8">
                {/* Background validation indicator in top right */}
                {isValidating && !isLoading && (
                    <BackgroundValidationIndicator text="Refreshing stories..." />
                )}

                {/* Cache status indicator - only for manager role */}
                {!isLoading &&
                    stories.length > 0 &&
                    session?.user?.role === "manager" && (
                        <div className="fixed top-20 right-4 z-40">
                            <div className="flex items-center gap-2">
                                {/* Cache health indicator */}
                                <div
                                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full cursor-pointer transition-all duration-200 hover:scale-105 ${
                                        cacheHealth === "fresh"
                                            ? "bg-emerald-500 text-white"
                                            : cacheHealth === "stale"
                                              ? "bg-amber-500 text-white"
                                              : cacheHealth === "expired"
                                                ? "bg-red-500 text-white"
                                                : "bg-[rgb(var(--color-muted))] text-[rgb(var(--color-muted-foreground))]"
                                    }`}
                                    onClick={() =>
                                        setShowCacheInfo(!showCacheInfo)
                                    }
                                    title={`Cache status: ${cacheHealth} - Click for details`}
                                >
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                    <span className="font-medium">
                                        {cacheHealth === "fresh"
                                            ? "📦 Fresh"
                                            : cacheHealth === "stale"
                                              ? "⏳ Stale"
                                              : cacheHealth === "expired"
                                                ? "🔄 Expired"
                                                : "❓ Unknown"}
                                    </span>
                                </div>

                                {/* Cache management button */}
                                <button
                                    onClick={() => {
                                        // cacheManager not available in hook
                                        mutate();
                                    }}
                                    className="text-xs px-2 py-1 bg-[rgb(var(--color-secondary))] hover:bg-[rgb(var(--color-secondary)/80%)] text-[rgb(var(--color-secondary-foreground))] rounded-full transition-colors"
                                    title="Clear cache and refresh"
                                >
                                    🗑️ Clear Cache
                                </button>
                            </div>

                            {/* Cache info panel */}
                            {showCacheInfo && (
                                <div className="absolute top-12 right-0 bg-[rgb(var(--color-background))] rounded-lg shadow-xl border border-[rgb(var(--color-border))] p-4 w-64 text-sm">
                                    <h4 className="font-medium mb-2 text-[rgb(var(--color-foreground))]">
                                        Cache Status
                                    </h4>
                                    <div className="space-y-1 text-[rgb(var(--color-muted-foreground))]">
                                        <div>
                                            Status:{" "}
                                            <span className="font-medium text-[rgb(var(--color-foreground))]">
                                                {cacheHealth}
                                            </span>
                                        </div>
                                        <div>
                                            Stories:{" "}
                                            <span className="font-medium text-[rgb(var(--color-foreground))]">
                                                {stories.length}
                                            </span>
                                        </div>
                                        <div>
                                            TTL:{" "}
                                            <span className="font-medium text-[rgb(var(--color-foreground))]">
                                                1 hour
                                            </span>
                                        </div>
                                        <div>
                                            Source:{" "}
                                            <span className="font-medium text-[rgb(var(--color-foreground))]">
                                                localStorage
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowCacheInfo(false)}
                                        className="mt-2 text-xs text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                {/* Show skeleton loading while fetching */}
                {/* ⚡ OPTIMIZATION: Only show skeleton if NO data exists (not cached, not fresh) */}
                {/* If cached data exists, show it immediately even while revalidating */}
                {/* Fix hydration: always show skeleton on first render if no data */}
                {!hasMounted || (isLoading && stories.length === 0) ? (
                    <SkeletonLoader>
                        <StoryGridSkeleton showFilters={true} cardCount={12} />
                    </SkeletonLoader>
                ) : error ? (
                    /* Error state */
                    <StoryLoadingError
                        title="Failed to load stories"
                        message={
                            error ||
                            "Something went wrong while loading stories."
                        }
                        onRetry={() => mutate()}
                        isRetrying={isValidating}
                    />
                ) : (
                    /* Success state with story grid */
                    <StoryGrid
                        stories={stories}
                        currentUserId={session?.user?.id}
                        pageType={pageType}
                    />
                )}
            </div>
        </div>
    );
}

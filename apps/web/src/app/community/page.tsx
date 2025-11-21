"use client";

import { useSession } from "next-auth/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { StoryGrid } from "@/components/browse/StoryGrid";
import {
    BackgroundValidationIndicator,
    StoryGridSkeleton,
    StoryLoadingError,
} from "@/components/common";
import { MainLayout } from "@/components/layout";
import { SkeletonLoader } from "@/components/ui";
import { useCommunityEvents } from "@/hooks/use-community-events";
import { useCommunityStories } from "@/hooks/use-page-cache";
import type {
    PostCreatedEvent,
    StoryPublishedEvent,
    StoryUpdatedEvent,
} from "@/lib/redis/client";

export default function CommunityPage() {
    const { data: session } = useSession();
    const [newStoryCount, setNewStoryCount] = useState(0);
    const [_recentlyPublishedStories, setRecentlyPublishedStories] = useState<
        string[]
    >([]);

    // Enhanced SWR hook with localStorage caching
    const { data, error, isLoading, isValidating } = useCommunityStories();

    // Handle real-time story published events
    const handleStoryPublished = useCallback((event: StoryPublishedEvent) => {
        console.log("📚 New story published in real-time:", event.title);

        // Show toast notification with action
        toast.success(`New story published: ${event.title}`, {
            description: event.genre ? `Genre: ${event.genre}` : undefined,
            duration: 5000,
            action: {
                label: "View",
                onClick: () => {
                    window.location.href = `/community/story/${event.storyId}`;
                },
            },
        });

        // Increment new story counter
        setNewStoryCount((prev) => prev + 1);

        // Add to recently published list
        setRecentlyPublishedStories((prev) =>
            [event.storyId, ...prev].slice(0, 5),
        );
    }, []);

    // Handle story updated events
    const handleStoryUpdated = useCallback((event: StoryUpdatedEvent) => {
        console.log("📝 Story updated in real-time:", event.storyId);
    }, []);

    // Handle post created events
    const handlePostCreated = useCallback((event: PostCreatedEvent) => {
        console.log("💬 New post created:", event.title);

        // Show subtle notification for new posts
        toast.info(`New discussion: ${event.title}`, {
            duration: 3000,
        });
    }, []);

    // Connect to SSE for real-time updates
    const { isConnected } = useCommunityEvents({
        onStoryPublished: handleStoryPublished,
        onStoryUpdated: handleStoryUpdated,
        onPostCreated: handlePostCreated,
        autoRevalidate: true,
    });

    // Transform data when available - convert to StoryGrid compatible format
    const stories = Array.isArray(data) && data.length > 0
        ? data.map((story: any) => ({
              id: story.id,
              title: story.title,
              summary: story.summary || "No summary available",
              genre: story.genre,
              status: story.status,
              isPublic: true,
              viewCount: story.totalPosts || 0,
              rating: 0,
              createdAt: new Date(story.lastActivity),
              imageUrl: story.imageUrl || story.coverImage || "",
              author: {
                  id: story.author?.id || "",
                  name: story.author?.name || story.author || "Unknown Author",
              },
          }))
        : [];

    return (
        <MainLayout>
            <div className="min-h-screen bg-[rgb(var(--color-background))]">
                <div className="container mx-auto px-4 pt-1 pb-8">
                    {/* Background validation indicator in top right */}
                    {isValidating && !isLoading && (
                        <BackgroundValidationIndicator text="Refreshing stories..." />
                    )}

                    {/* Real-time connection indicator */}
                    {isConnected && (
                        <div className="fixed top-20 left-4 z-50">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full text-xs text-green-700 dark:text-green-400">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>Live</span>
                            </div>
                        </div>
                    )}

                    {/* New stories notification banner */}
                    {newStoryCount > 0 && (
                        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 animate-in fade-in slide-in-from-top duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {newStoryCount}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {newStoryCount === 1
                                                ? "New story published!"
                                                : `${newStoryCount} new stories published!`}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Scroll down to see the latest
                                            additions
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setNewStoryCount(0);
                                        setRecentlyPublishedStories([]);
                                        window.scrollTo({
                                            top: document.body.scrollHeight,
                                            behavior: "smooth",
                                        });
                                    }}
                                    className="flex-shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    View Now
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <SkeletonLoader>
                            <StoryGridSkeleton
                                showFilters={true}
                                cardCount={12}
                            />
                        </SkeletonLoader>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <StoryLoadingError
                            title="Failed to load community stories"
                            message={
                                error.message ||
                                "Something went wrong while loading stories."
                            }
                            onRetry={() => window.location.reload()}
                        />
                    )}

                    {/* Success state with story grid */}
                    {!isLoading && !error && (
                        <div data-testid="posts-container">
                            <div data-testid="posts-list">
                                <StoryGrid
                                    stories={stories}
                                    currentUserId={session?.user?.id}
                                    pageType="community"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}

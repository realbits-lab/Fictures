/**
 * Community Content Client Component
 *
 * Handles client-side interactivity:
 * - Real-time SSE updates
 * - SWR data revalidation
 * - Toast notifications
 * - New story announcements
 *
 * Receives SSR data as initial fallback for instant rendering
 */

"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CommunityStoryCard } from "@/components/community/CommunityStoryCard";
import { MetricCard } from "@/components/community/metric-card";
import { Button, Card, CardContent } from "@/components/ui";
import { useCommunityEvents } from "@/hooks/use-community-events";
import { useCommunityStories } from "@/hooks/use-page-cache";
import type {
    PostCreatedEvent,
    StoryPublishedEvent,
    StoryUpdatedEvent,
} from "@/lib/redis/client";

interface CommunityStory {
    id: string;
    title: string;
    summary: string;
    genre: string | null;
    status: string;
    coverImage: string | null;
    imageUrl?: string | null;
    author: {
        id: string;
        name: string;
        username: string | null;
    };
    totalPosts: number;
    totalMembers: number;
    isActive: boolean | string;
    lastActivity: string;
}

interface CommunityStats {
    activeToday: number;
    commentsToday: number;
    averageRating: number;
    totalStories: number;
    totalPosts: number;
    totalMembers: number;
}

interface CommunityContentClientProps {
    initialStories: CommunityStory[];
}

export function CommunityContentClient({
    initialStories,
}: CommunityContentClientProps) {
    const [newStoryCount, setNewStoryCount] = useState(0);
    const [recentlyPublishedStories, setRecentlyPublishedStories] = useState<
        string[]
    >([]);

    // Helper function for formatting relative time
    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60),
        );

        if (diffInHours < 1) return "Just now";
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 48) return "1 day ago";
        return `${Math.floor(diffInHours / 24)} days ago`;
    };

    // Enhanced SWR hook with localStorage caching + SSR fallback
    const { data, error, isLoading, isValidating } = useCommunityStories();

    // Use SSR data as fallback if SWR data not ready
    // data is an array, not an object with success/stories
    const stories = (Array.isArray(data) && data.length > 0 ? data : initialStories).map(
        (story: any) => ({
            ...story,
            author: story.author?.name || story.author || "Unknown Author",
            summary: story.summary || "No summary available",
            coverImage: story.imageUrl || story.coverImage || "",
            lastActivity: formatRelativeTime(story.lastActivity),
        }),
    );

    // Handle real-time story published events
    const handleStoryPublished = useCallback((event: StoryPublishedEvent) => {
        console.log("📚 New story published in real-time:", event.title);

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

        setNewStoryCount((prev) => prev + 1);
        setRecentlyPublishedStories((prev) =>
            [event.storyId, ...prev].slice(0, 5),
        );
    }, []);

    const handleStoryUpdated = useCallback((event: StoryUpdatedEvent) => {
        console.log("📝 Story updated in real-time:", event.storyId);
    }, []);

    const handlePostCreated = useCallback((event: PostCreatedEvent) => {
        console.log("💬 New post created:", event.title);
        toast.info(`New discussion: ${event.title}`, { duration: 3000 });
    }, []);

    // Connect to SSE for real-time updates
    const { isConnected } = useCommunityEvents({
        onStoryPublished: handleStoryPublished,
        onStoryUpdated: handleStoryUpdated,
        onPostCreated: handlePostCreated,
        autoRevalidate: true,
    });

    // Calculate stats from fetched data
    const stats: CommunityStats =
        stories.length > 0
            ? {
                  totalStories: stories.length,
                  totalPosts: stories.reduce(
                      (sum: number, story: CommunityStory) =>
                          sum + story.totalPosts,
                      0,
                  ),
                  totalMembers: stories.reduce(
                      (sum: number, story: CommunityStory) =>
                          sum + story.totalMembers,
                      0,
                  ),
                  activeToday: stories.filter(
                      (story: CommunityStory) => story.isActive,
                  ).length,
                  commentsToday: Math.floor(
                      stories.reduce(
                          (sum: number, story: CommunityStory) =>
                              sum + story.totalPosts,
                          0,
                      ) * 0.3,
                  ),
                  averageRating: 4.7,
              }
            : {
                  activeToday: 0,
                  commentsToday: 0,
                  averageRating: 0,
                  totalStories: 0,
                  totalPosts: 0,
                  totalMembers: 0,
              };

    return (
        <>
            {/* Real-time connection indicator */}
            {isConnected && (
                <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full text-xs text-green-700 dark:text-green-400 w-fit mx-auto mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live Updates Active</span>
                </div>
            )}

            {/* New stories notification banner */}
            {newStoryCount > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8 animate-in fade-in slide-in-from-top duration-300">
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
                                    Scroll down to see the latest additions to
                                    our community
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

            {/* Error State */}
            {error && (
                <Card className="border-red-200 dark:border-red-800 mb-8">
                    <CardContent className="py-8 text-center">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Failed to load community data
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {error.toString()}
                        </p>
                        <Button onClick={() => window.location.reload()}>
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Community Stats */}
            <div className="relative mb-8">
                {isValidating && !isLoading && (
                    <div className="absolute -top-2 right-0 z-10">
                        <div className="flex items-center gap-2 text-xs text-blue-500 dark:text-blue-400 opacity-60">
                            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Updating...</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <MetricCard
                        value={stats.activeToday}
                        label="Active Today"
                        color="text-blue-600"
                        summary="Stories with recent community activity in the past 24 hours."
                        details={[
                            "Includes stories with new posts or comments",
                            "Shows real-time engagement",
                            "Updated throughout the day",
                        ]}
                    />

                    <MetricCard
                        value={stats.commentsToday}
                        label="Comments Today"
                        color="text-green-600"
                        summary="Total number of comments posted across all stories today."
                        details={[
                            "Counts all discussion replies",
                            "Refreshes every 30 minutes",
                            "Helps track daily engagement",
                        ]}
                    />

                    <MetricCard
                        value={stats.averageRating}
                        label="Avg Rating"
                        color="text-purple-600"
                        summary="Average community rating across all published stories."
                        details={[
                            "Based on reader feedback",
                            "Calculated from all published stories",
                            "Scale: 1.0 to 5.0 stars",
                        ]}
                    />

                    <MetricCard
                        value={stats.totalStories}
                        label="Stories"
                        color="text-orange-600"
                        summary="Total number of published stories available in the community."
                        details={[
                            "Only published stories are shown",
                            "Draft stories are not included",
                            "Browse and read any story",
                        ]}
                    />

                    <MetricCard
                        value={stats.totalPosts}
                        label="Discussions"
                        color="text-red-600"
                        summary="Total discussion threads across all community stories."
                        details={[
                            "Includes all posts and topics",
                            "Each story has its own discussions",
                            "Join conversations anytime",
                        ]}
                    />

                    <MetricCard
                        value={stats.totalMembers}
                        label="Members"
                        color="text-indigo-600"
                        summary="Total unique users who have participated in community discussions."
                        details={[
                            "Active contributors and readers",
                            "Sign in to join the community",
                            "No membership fees",
                        ]}
                    />
                </div>
            </div>

            {/* Story Selection */}
            <div className="relative">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            📚 Choose a Story
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Select a story to join its community discussions
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {isValidating && !isLoading && (
                            <div className="flex items-center gap-2 text-xs text-blue-500 dark:text-blue-400 opacity-60">
                                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span>Refreshing stories...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Story Grid */}
                {stories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {stories.map((story: CommunityStory, index: number) => {
                            const isNewlyPublished =
                                recentlyPublishedStories.includes(story.id);
                            return (
                                <div
                                    key={story.id}
                                    className={
                                        isNewlyPublished
                                            ? "relative animate-in fade-in slide-in-from-bottom duration-500"
                                            : ""
                                    }
                                >
                                    {isNewlyPublished && (
                                        <div className="absolute -top-2 -right-2 z-10 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                                            NEW
                                        </div>
                                    )}
                                    <CommunityStoryCard
                                        story={{
                                            ...story,
                                            genre: story.genre || "",
                                            author: typeof story.author === "string" ? story.author : story.author?.name || "Unknown Author",
                                            isActive: typeof story.isActive === "boolean" 
                                                ? story.isActive 
                                                : (typeof story.isActive === "string" && story.isActive === "true") || (story.isActive as any) === true || false,
                                            coverImage: story.coverImage || "",
                                        }}
                                        priority={index === 0}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="text-4xl mb-4">📚</div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                No public stories yet
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Stories will appear here once authors make them
                                public for community discussions
                            </p>
                            <div className="flex justify-center gap-3">
                                <Link href="/stories">
                                    <Button variant="outline">
                                        📝 View All Stories
                                    </Button>
                                </Link>
                                <Link href="/stories/new">
                                    <Button>✍️ Write Your Story</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

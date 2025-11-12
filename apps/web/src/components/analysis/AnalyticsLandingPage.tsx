"use client";

import { BarChart3, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import useSWR from "swr";
import { Button, SkeletonLoader } from "@/components/ui";
import { AnalyticsStoryCard } from "./AnalyticsStoryCard";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Story {
    id: string;
    title: string;
    summary: string;
    genre: string;
    status: string;
    imageUrl: string | null;
    imageVariants: any;
    createdAt: Date;
    views: number;
    readers: number;
    engagement: number;
    trend: "up" | "down" | "stable";
    trendPercentage: number;
}

export function AnalyticsLandingPage() {
    const { data: session } = useSession();
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

    const { data, isLoading, error } = useSWR<{ stories: Story[] }>(
        session?.user?.id ? `/analysis/api/list?range=${timeRange}` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        },
    );

    const stories = data?.stories || [];

    // Loading state
    if (!session?.user?.id) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center text-[rgb(var(--color-muted-foreground))]">
                    Please sign in to view analytics.
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <SkeletonLoader>
                    <div className="space-y-6">
                        <div className="h-10 w-64 bg-[rgb(var(--color-muted))] rounded animate-pulse"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div
                                    key={i}
                                    className="h-96 bg-[rgb(var(--color-muted))] rounded-lg animate-pulse"
                                ></div>
                            ))}
                        </div>
                    </div>
                </SkeletonLoader>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center space-y-4">
                    <div className="text-6xl">📊</div>
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">
                        Failed to Load Analytics
                    </h2>
                    <p className="text-[rgb(var(--color-muted-foreground))]">
                        {error.message ||
                            "An error occurred while fetching analytics data."}
                    </p>
                    <Button onClick={() => window.location.reload()}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[rgb(var(--color-foreground))] flex items-center gap-3">
                        <BarChart3 className="w-8 h-8" />
                        Story Analytics
                    </h1>
                    <p className="text-[rgb(var(--color-muted-foreground))] mt-2">
                        Track your story performance and reader engagement
                    </p>
                </div>

                {/* Time Range Selector */}
                <div className="flex items-center gap-2 bg-[rgb(var(--color-muted))] p-1 rounded-lg">
                    <button
                        onClick={() => setTimeRange("7d")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            timeRange === "7d"
                                ? "bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] shadow"
                                : "text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]"
                        }`}
                    >
                        7 Days
                    </button>
                    <button
                        onClick={() => setTimeRange("30d")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            timeRange === "30d"
                                ? "bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] shadow"
                                : "text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]"
                        }`}
                    >
                        30 Days
                    </button>
                    <button
                        onClick={() => setTimeRange("90d")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            timeRange === "90d"
                                ? "bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] shadow"
                                : "text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]"
                        }`}
                    >
                        90 Days
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-sm font-medium text-[rgb(var(--color-muted-foreground))]">
                            Total Stories
                        </h3>
                    </div>
                    <p className="text-3xl font-bold text-[rgb(var(--color-foreground))]">
                        {stories.length}
                    </p>
                </div>

                <div className="bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-sm font-medium text-[rgb(var(--color-muted-foreground))]">
                            Total Views
                        </h3>
                    </div>
                    <p className="text-3xl font-bold text-[rgb(var(--color-foreground))]">
                        {stories
                            .reduce((sum, s) => sum + s.views, 0)
                            .toLocaleString()}
                    </p>
                </div>

                <div className="bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-sm font-medium text-[rgb(var(--color-muted-foreground))]">
                            Total Readers
                        </h3>
                    </div>
                    <p className="text-3xl font-bold text-[rgb(var(--color-foreground))]">
                        {stories
                            .reduce((sum, s) => sum + s.readers, 0)
                            .toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Story Cards Grid */}
            {stories.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                    <div className="text-6xl">📚</div>
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">
                        No Stories Yet
                    </h2>
                    <p className="text-[rgb(var(--color-muted-foreground))]">
                        Create your first story in the Studio to see analytics
                        here.
                    </p>
                    <Link href="/studio/new">
                        <Button>Create Story</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stories.map((story) => (
                        <AnalyticsStoryCard key={story.id} {...story} />
                    ))}
                </div>
            )}
        </div>
    );
}

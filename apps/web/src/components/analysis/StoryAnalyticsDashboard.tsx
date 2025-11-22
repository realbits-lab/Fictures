"use client";

import {
    ArrowLeft,
    Clock,
    DollarSign,
    Eye,
    Heart,
    Star,
    Target,
    TrendingUp,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import useSWR from "swr";
import { Button, SkeletonLoader } from "@/components/ui";
import { BarChart } from "./bar-chart";
import { LineChart } from "./line-chart";
import { MetricCard } from "./metric-card";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StoryAnalyticsDashboardProps {
    storyId: string;
}

export function StoryAnalyticsDashboard({
    storyId,
}: StoryAnalyticsDashboardProps) {
    const { data: session } = useSession();
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

    const {
        data: analytics,
        isLoading: analyticsLoading,
        error: analyticsError,
    } = useSWR(
        session?.user?.id
            ? `/api/analysis/story/${storyId}?range=${timeRange}`
            : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        },
    );

    const { data: dailyData, isLoading: dailyLoading } = useSWR(
        session?.user?.id
            ? `/api/analysis/daily?storyId=${storyId}&range=${timeRange}`
            : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        },
    );

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

    if (analyticsLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <SkeletonLoader>
                    <div className="space-y-8">
                        <div className="h-10 w-full max-w-md bg-[rgb(var(--color-muted))] rounded animate-pulse"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="h-32 bg-[rgb(var(--color-muted))] rounded-lg animate-pulse"
                                ></div>
                            ))}
                        </div>
                        <div className="h-96 bg-[rgb(var(--color-muted))] rounded-lg animate-pulse"></div>
                    </div>
                </SkeletonLoader>
            </div>
        );
    }

    if (analyticsError || !analytics) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center space-y-4">
                    <div className="text-6xl">📊</div>
                    <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))]">
                        Failed to Load Analytics
                    </h2>
                    <p className="text-[rgb(var(--color-muted-foreground))]">
                        {analyticsError?.message ||
                            "An error occurred while fetching analytics data."}
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button onClick={() => window.location.reload()}>
                            Retry
                        </Button>
                        <Link href="/analysis">
                            <Button variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Analytics
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const daily = dailyData?.data || [];

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <Link
                        href="/analysis"
                        className="inline-flex items-center gap-2 text-sm text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Analytics
                    </Link>
                    <h1 className="text-3xl font-bold text-[rgb(var(--color-foreground))]">
                        {analytics.title}
                    </h1>
                    <p className="text-[rgb(var(--color-muted-foreground))] mt-2">
                        Detailed performance analytics and insights
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    {/* ROI Analysis Link */}
                    <Link href={`/analysis/${storyId}/roi`}>
                        <Button
                            variant="outline"
                            className="w-full md:w-auto"
                        >
                            <DollarSign className="w-4 h-4 mr-2" />
                            View ROI Analysis
                        </Button>
                    </Link>

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
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Total Views"
                    value={analytics.totalViews.toLocaleString()}
                    change={analytics.trends.viewsChange}
                    trend={
                        analytics.trends.viewsChange > 0
                            ? "up"
                            : analytics.trends.viewsChange < 0
                              ? "down"
                              : "neutral"
                    }
                    icon={
                        <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    }
                    description={`${timeRange} period`}
                />
                <MetricCard
                    title="Unique Readers"
                    value={analytics.uniqueReaders.toLocaleString()}
                    change={analytics.trends.readersChange}
                    trend={
                        analytics.trends.readersChange > 0
                            ? "up"
                            : analytics.trends.readersChange < 0
                              ? "down"
                              : "neutral"
                    }
                    icon={
                        <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                    }
                    description={`${timeRange} period`}
                />
                <MetricCard
                    title="Engagement Rate"
                    value={`${analytics.engagement.rate.toFixed(1)}%`}
                    change={analytics.trends.engagementChange}
                    trend={
                        analytics.trends.engagementChange > 0
                            ? "up"
                            : analytics.trends.engagementChange < 0
                              ? "down"
                              : "neutral"
                    }
                    icon={
                        <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    }
                    description="Comments + Likes + Shares"
                />
                <MetricCard
                    title="Quality Score"
                    value={`${analytics.quality.avgScore.toFixed(1)}/4.0`}
                    icon={
                        <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    }
                    description="Average scene quality"
                />
            </div>

            {/* Retention Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <MetricCard
                    title="Completion Rate"
                    value={`${analytics.retention.completionRate.toFixed(1)}%`}
                    icon={
                        <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    }
                    description="Readers who finished"
                />
                <MetricCard
                    title="Return Rate"
                    value={`${analytics.retention.returnRate.toFixed(1)}%`}
                    icon={
                        <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    }
                    description="Readers who come back"
                />
                <MetricCard
                    title="Avg Session"
                    value={`${Math.floor(analytics.retention.avgSessionDuration / 60)}m ${analytics.retention.avgSessionDuration % 60}s`}
                    icon={
                        <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    }
                    description="Time per reading session"
                />
            </div>

            {/* Trends Chart */}
            <div className="bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-[rgb(var(--color-foreground))] mb-4">
                    Views & Engagement Over Time
                </h2>
                {dailyLoading ? (
                    <div className="h-80 flex items-center justify-center">
                        <p className="text-[rgb(var(--color-muted-foreground))]">
                            Loading chart...
                        </p>
                    </div>
                ) : daily.length === 0 ? (
                    <div className="h-80 flex items-center justify-center">
                        <p className="text-[rgb(var(--color-muted-foreground))]">
                            No data available for this period
                        </p>
                    </div>
                ) : (
                    <LineChart
                        data={daily}
                        xKey="date"
                        lines={[
                            { key: "views", name: "Views", color: "#3b82f6" },
                            {
                                key: "readers",
                                name: "Unique Readers",
                                color: "#10b981",
                            },
                            {
                                key: "engagement",
                                name: "Engagements",
                                color: "#f59e0b",
                            },
                        ]}
                        height={320}
                    />
                )}
            </div>

            {/* Quality Breakdown */}
            <div className="bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-[rgb(var(--color-foreground))] mb-4">
                    Quality Breakdown
                </h2>
                <BarChart
                    data={[
                        {
                            category: "Plot",
                            score: analytics.quality.scoresByCategory.plot,
                        },
                        {
                            category: "Character",
                            score: analytics.quality.scoresByCategory.character,
                        },
                        {
                            category: "Pacing",
                            score: analytics.quality.scoresByCategory.pacing,
                        },
                        {
                            category: "Prose",
                            score: analytics.quality.scoresByCategory.prose,
                        },
                        {
                            category: "World-Building",
                            score: analytics.quality.scoresByCategory
                                .worldBuilding,
                        },
                    ]}
                    xKey="category"
                    bars={[
                        {
                            key: "score",
                            name: "Quality Score",
                            color: "#8b5cf6",
                        },
                    ]}
                    height={300}
                />
            </div>

            {/* Engagement Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl">💬</div>
                        <h3 className="text-sm font-medium text-[rgb(var(--color-muted-foreground))]">
                            Comments
                        </h3>
                    </div>
                    <p className="text-3xl font-bold text-[rgb(var(--color-foreground))]">
                        {analytics.engagement.comments.toLocaleString()}
                    </p>
                </div>

                <div className="bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl">❤️</div>
                        <h3 className="text-sm font-medium text-[rgb(var(--color-muted-foreground))]">
                            Likes
                        </h3>
                    </div>
                    <p className="text-3xl font-bold text-[rgb(var(--color-foreground))]">
                        {analytics.engagement.likes.toLocaleString()}
                    </p>
                </div>

                <div className="bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl">📤</div>
                        <h3 className="text-sm font-medium text-[rgb(var(--color-muted-foreground))]">
                            Shares
                        </h3>
                    </div>
                    <p className="text-3xl font-bold text-[rgb(var(--color-foreground))]">
                        {analytics.engagement.shares.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}

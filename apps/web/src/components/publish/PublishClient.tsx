"use client";

import { useSession } from "next-auth/react";
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Skeleton,
    SkeletonLoader,
} from "@/components/ui";
import {
    usePublishAnalysis,
    usePublishHistory,
    usePublishStatus,
} from "@/lib/hooks/use-page-cache";

// Skeleton components for loading states
function PublishingScheduleSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    📅 Publishing Schedule
                    <Skeleton className="h-7 w-30 rounded" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-5 w-25 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                            >
                                <div className="text-center space-y-2">
                                    <Skeleton className="h-5 w-20" />
                                    <Skeleton className="h-4 w-30" />
                                    <Skeleton className="h-3 w-15" />
                                    <Skeleton className="h-5 w-15 rounded-full" />
                                    <Skeleton className="h-8 w-full rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function QuickPublishSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>🚀 Quick Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Skeleton className="h-6 w-3/5 mb-4" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Skeleton className="h-[14px] w-20" />
                                <Skeleton className="h-5 w-15 rounded-full" />
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                        <Skeleton className="h-5 w-15 mb-2" />
                        <Skeleton className="h-4 w-9/10" />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Skeleton className="h-5 w-30 mb-3" />
                            <div className="flex gap-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2"
                                    >
                                        <Skeleton className="h-4 w-4 rounded" />
                                        <Skeleton className="h-[14px] w-25" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Skeleton className="h-5 w-35 mb-3" />
                            <div className="space-y-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2"
                                    >
                                        <Skeleton className="h-4 w-4 rounded" />
                                        <Skeleton className="h-[14px] w-50" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-9 w-20 rounded" />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function AnalyticsSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <CardTitle>
                            <Skeleton className="h-6 w-45" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Skeleton className="h-5 w-40 mb-3" />
                            <Skeleton className="h-[14px] w-30 mb-3" />

                            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                {Array.from({ length: 4 }).map((_, j) => (
                                    <div
                                        key={j}
                                        className="flex justify-between"
                                    >
                                        <Skeleton className="h-[14px] w-15" />
                                        <Skeleton className="h-[14px] w-10" />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between text-sm mb-1">
                                    <Skeleton className="h-[14px] w-25" />
                                    <Skeleton className="h-[14px] w-8" />
                                </div>
                                <Skeleton className="h-[14px] w-35" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function PublishClient() {
    const { data: session } = useSession();
    const {
        data: publishStatus,
        isLoading: statusLoading,
        error: statusError,
        mutate: refreshStatus,
    } = usePublishStatus();
    const {
        data: publishHistory,
        isLoading: historyLoading,
        error: historyError,
    } = usePublishHistory();
    const {
        data: publishAnalysis,
        isLoading: analysisLoading,
        error: analysisError,
    } = usePublishAnalysis();

    const isLoading = statusLoading || historyLoading || analysisLoading;
    const hasError = statusError || historyError || analysisError;

    // Show loading state for unauthenticated users
    if (!session?.user?.id) {
        return <div>Please sign in to view your publication center.</div>;
    }

    // Show skeleton loading while fetching
    if (isLoading) {
        return (
            <SkeletonLoader>
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span>📤</span>
                            <Skeleton className="h-9 w-50" />
                        </div>
                        <Skeleton className="h-4 w-75" />
                    </div>
                    <PublishingScheduleSkeleton />
                    <QuickPublishSkeleton />
                    <AnalyticsSkeleton />
                </div>
            </SkeletonLoader>
        );
    }

    // Show error state
    if (hasError) {
        const errorMessage =
            statusError?.message ||
            historyError?.message ||
            analysisError?.message;
        return (
            <div className="text-center py-12">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Failed to load publication data
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {errorMessage ||
                        "Something went wrong while loading your publication center."}
                </p>
                <button
                    onClick={() => {
                        refreshStatus();
                    }}
                    className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))] rounded-lg hover:bg-[rgb(var(--color-primary)/90%)] transition-colors disabled:opacity-50"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Publishing Schedule */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        📅 Publishing Schedule
                        <Button variant="secondary" size="sm">
                            ⚙️ Schedule Settings
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            This Week
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {(publishStatus?.scheduledItems || []).map(
                                (item: any, index: number) => (
                                    <div
                                        key={item.id || index}
                                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                                    >
                                        <div className="text-center space-y-2">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                {item.date ||
                                                    `Day ${index + 1}`}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {item.title ||
                                                    `Item ${index + 1}`}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                ⏰ {item.time || "TBD"}
                                            </div>
                                            <Badge
                                                variant={
                                                    item.status === "ready"
                                                        ? "default"
                                                        : item.status ===
                                                            "draft"
                                                          ? "secondary"
                                                          : "outline"
                                                }
                                            >
                                                {item.status === "ready"
                                                    ? "✅ Ready"
                                                    : item.status === "draft"
                                                      ? "📝 Draft"
                                                      : item.status ===
                                                          "planned"
                                                        ? "📋 Planned"
                                                        : "💭 Idea"}
                                            </Badge>
                                            <Button
                                                size="sm"
                                                className="w-full mt-2"
                                                variant={
                                                    item.status === "ready"
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {item.status === "ready"
                                                    ? "📤 Publish"
                                                    : item.status === "draft"
                                                      ? "✏️ Edit"
                                                      : item.status ===
                                                          "planned"
                                                        ? "📝 Write"
                                                        : "📋 Plan"}
                                            </Button>
                                        </div>
                                    </div>
                                ),
                            )}

                            {/* Fallback static content if no data */}
                            {(!publishStatus?.scheduledItems ||
                                publishStatus.scheduledItems.length === 0) && (
                                <>
                                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <div className="text-center space-y-2">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                Wed Nov 15
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                Ch 16: Final Confrontation
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                ⏰ 2:00 PM
                                            </div>
                                            <Badge variant="default">
                                                ✅ Ready
                                            </Badge>
                                            <Button
                                                size="sm"
                                                className="w-full mt-2"
                                            >
                                                📤 Publish
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <div className="text-center space-y-2">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                Fri Nov 17
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                Part III Complete
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                ⏰ 6:00 PM
                                            </div>
                                            <Badge variant="destructive">
                                                📝 Draft
                                            </Badge>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-full mt-2"
                                            >
                                                ✏️ Edit
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <div className="text-center space-y-2">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                Mon Nov 20
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                New Story Announcement
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                ⏰ 12:00 PM
                                            </div>
                                            <Badge variant="secondary">
                                                📋 Planned
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full mt-2"
                                            >
                                                📝 Write
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <div className="text-center space-y-2">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                Wed Nov 22
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                Ch 1: Next Adventure
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                ⏰ 2:00 PM
                                            </div>
                                            <Badge variant="default">
                                                💭 Idea
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full mt-2"
                                            >
                                                📋 Plan
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Publish */}
            <Card>
                <CardHeader>
                    <CardTitle>🚀 Quick Publish</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                            {publishStatus?.readyToPublish?.title ||
                                'Chapter 16: "Final Confrontation"'}{" "}
                            - Ready to Publish
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Word Count:</span>
                                <Badge variant="default"></Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Target:</span>
                                <Badge variant="default"></Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Quality Check:</span>
                                <Badge variant="default">✅</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Title:</span>
                                <Badge variant="default">
                                    {publishStatus?.readyToPublish
                                        ?.shortTitle ||
                                        "Final Confrontation"}{" "}
                                    ✅
                                </Badge>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Preview:
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                {publishStatus?.readyToPublish?.preview ||
                                    `"Maya stood at the threshold between worlds, shadows dancing around her like eager servants. The Void Collector's offer hung in the air..."`}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                    Schedule Options:
                                </h4>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="schedule"
                                            className="text-blue-600"
                                        />
                                        <span className="text-sm">
                                            🔘 Publish Now
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="schedule"
                                            className="text-blue-600"
                                            defaultChecked
                                        />
                                        <span className="text-sm">
                                            🔘 Schedule:{" "}
                                            {publishStatus?.readyToPublish
                                                ?.scheduledTime ||
                                                "Nov 15, 2:00 PM"}
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="schedule"
                                            className="text-blue-600"
                                        />
                                        <span className="text-sm">
                                            🔘 Save as Draft
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                    Community Features:
                                </h4>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            defaultChecked
                                            className="text-blue-600"
                                        />
                                        <span className="text-sm">
                                            ☑️ Enable comments
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            defaultChecked
                                            className="text-blue-600"
                                        />
                                        <span className="text-sm">
                                            ☑️ Allow theories
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            defaultChecked
                                            className="text-blue-600"
                                        />
                                        <span className="text-sm">
                                            ☑️ Notify subscribers
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            defaultChecked
                                            className="text-blue-600"
                                        />
                                        <span className="text-sm">
                                            ☑️ Community poll:{" "}
                                            {publishStatus?.readyToPublish
                                                ?.communityPoll ||
                                                '"What should Maya choose?"'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button variant="ghost">🔍 Preview</Button>
                            <Button variant="secondary">✏️ Edit</Button>
                            <Button>📤 Publish</Button>
                            <Button variant="ghost">💾 Save Draft</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>📊 Publication Analytics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                {publishAnalysis?.latestChapter?.title ||
                                    "Chapter 15"}{" "}
                                Performance
                            </h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Published:{" "}
                                {publishAnalysis?.latestChapter
                                    ?.publishedAgo || "3 days ago"}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    👁️ Views:{" "}
                                    <span className="font-medium">
                                        {publishAnalysis?.latestChapter?.views?.toLocaleString() ||
                                            "3,247"}
                                    </span>
                                </div>
                                <div>
                                    💬 Comments:{" "}
                                    <span className="font-medium">
                                        {publishAnalysis?.latestChapter?.comments?.toLocaleString() ||
                                            "126"}
                                    </span>
                                </div>
                                <div>
                                    ❤️ Reactions:{" "}
                                    <span className="font-medium">
                                        {publishAnalysis?.latestChapter?.reactions?.toLocaleString() ||
                                            "456"}
                                    </span>
                                </div>
                                <div>
                                    ⭐ Rating:{" "}
                                    <span className="font-medium">
                                        {publishAnalysis?.latestChapter
                                            ?.rating || "4.9"}
                                        /5
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>📈 Engagement Rate:</span>
                                    <span className="font-medium">
                                        {publishAnalysis?.latestChapter
                                            ?.engagementRate || "87"}
                                        %
                                    </span>
                                </div>
                                <div className="text-sm text-green-600">
                                    🔥 Trending: #
                                    {publishAnalysis?.latestChapter
                                        ?.trendingRank || "2"}{" "}
                                    in{" "}
                                    {publishAnalysis?.latestChapter?.genre ||
                                        "Fantasy"}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>🎯 Reader Engagement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                📈 Pre-publish Buzz
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Theories:
                                    </span>
                                    <span className="font-medium text-green-600">
                                        +
                                        {publishAnalysis?.prepublishBuzz
                                            ?.theories || "89"}{" "}
                                        new
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Comments:
                                    </span>
                                    <span className="font-medium text-green-600">
                                        +
                                        {publishAnalysis?.prepublishBuzz
                                            ?.comments || "234"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Anticipation:
                                    </span>
                                    <span className="font-medium">
                                        {publishAnalysis?.prepublishBuzz
                                            ?.anticipation || "94"}
                                        %
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    📊 Optimal Time:
                                </h5>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {publishAnalysis?.optimalTime?.time ||
                                        "Wed 2:00 PM PST"}
                                    <br />
                                    <span className="text-xs">
                                        (
                                        {publishAnalysis?.optimalTime
                                            ?.activeReaderPercentage || "89"}
                                        % readers active)
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="mt-2"
                                >
                                    📋 Engagement Tips
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

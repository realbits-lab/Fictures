"use client";

import React from "react";
import { Skeleton, SkeletonLoader } from "@/components/ui";
import { useAppStats } from "@/lib/hooks/use-page-cache";

function StatsCardSkeleton() {
    return (
        <div className="text-center p-6 bg-[rgb(var(--color-card)/80%)] backdrop-blur-sm rounded-lg shadow-sm border border-[rgb(var(--color-border)/50%)]">
            <div className="mb-2">
                <Skeleton className="h-9 w-20" />
            </div>
            <div>
                <Skeleton className="h-4 w-25" />
            </div>
        </div>
    );
}

function StatsSkeletonSection() {
    return (
        <div className="py-16 bg-[rgb(var(--color-primary)/8%)] dark:bg-[rgb(var(--color-primary)/12%)]">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <Skeleton className="h-8 w-60 mx-auto mb-4" />
                    <Skeleton className="h-5 w-50 mx-auto" />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                </div>
            </div>
        </div>
    );
}

export function HomeStatsClient() {
    const { data, isLoading, isValidating, error, mutate } = useAppStats();

    // Show skeleton loading while fetching
    if (isLoading) {
        return (
            <SkeletonLoader>
                <StatsSkeletonSection />
            </SkeletonLoader>
        );
    }

    // Show error state with retry
    if (error) {
        return (
            <div className="py-16 bg-[rgb(var(--color-primary)/8%)] dark:bg-[rgb(var(--color-primary)/12%)]">
                <div className="container mx-auto px-4">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                            Unable to Load Stats
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {error.message}
                        </p>
                        <button
                            onClick={mutate}
                            className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))] rounded-lg hover:bg-[rgb(var(--color-primary)/90%)] transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show unauthenticated state
    if (!data?.isAuthenticated) {
        return (
            <div className="py-16 bg-[rgb(var(--color-primary)/8%)] dark:bg-[rgb(var(--color-primary)/12%)]">
                <div className="container mx-auto px-4">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                            Start Your Writing Journey
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            Sign in to begin creating amazing stories with AI
                            assistance.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-16 bg-[rgb(var(--color-primary)/8%)] dark:bg-[rgb(var(--color-primary)/12%)]">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center justify-center gap-2">
                        Your Writing Progress
                        {isValidating && (
                            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin opacity-60"></div>
                        )}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Keep up the great work, {data?.userName || "Writer"}!
                    </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                    <div className="text-center p-6 bg-[rgb(var(--color-card)/80%)] backdrop-blur-sm rounded-lg shadow-sm border border-[rgb(var(--color-border)/50%)]">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            {data?.totalStories || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Stories Created
                        </div>
                    </div>

                    <div className="text-center p-6 bg-[rgb(var(--color-card)/80%)] backdrop-blur-sm rounded-lg shadow-sm border border-[rgb(var(--color-border)/50%)]">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                            {data?.totalWords?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Words Written
                        </div>
                    </div>

                    <div className="text-center p-6 bg-[rgb(var(--color-card)/80%)] backdrop-blur-sm rounded-lg shadow-sm border border-[rgb(var(--color-border)/50%)]">
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                            {data?.totalReaders?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Total Readers
                        </div>
                    </div>

                    <div className="text-center p-6 bg-[rgb(var(--color-card)/80%)] backdrop-blur-sm rounded-lg shadow-sm border border-[rgb(var(--color-border)/50%)]">
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                            {data?.avgRating || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Average Rating
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

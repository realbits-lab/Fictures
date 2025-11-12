/**
 * Loading Skeletons for Community Pages
 *
 * Shown during SSR streaming while content is being fetched
 * Provides instant visual feedback for better perceived performance
 */

import { Card, CardContent } from "@/components/ui";

/**
 * Main community page loading skeleton
 * Shows stats grid + stories grid placeholders
 */
export function CommunityPageSkeleton() {
    return (
        <div className="space-y-8">
            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="text-center">
                        <CardContent className="py-4">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-2 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto animate-pulse"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Stories Section Header Skeleton */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
                </div>
            </div>

            {/* Stories Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <Card key={i}>
                        <div className="p-4 space-y-3">
                            {/* Image skeleton */}
                            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            {/* Title skeleton */}
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-4/5 animate-pulse"></div>
                            {/* Author skeleton */}
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/5 animate-pulse"></div>
                            {/* Stats skeleton */}
                            <div className="flex justify-between">
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

/**
 * Story detail page loading skeleton
 * Shows story header + sidebar + posts list placeholders
 */
export function CommunityStorySkeleton() {
    return (
        <div className="flex gap-6">
            {/* Sidebar Skeleton */}
            <aside className="w-80 flex-shrink-0">
                <Card>
                    <div className="p-6 space-y-4">
                        {/* Story info */}
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>

                        {/* Characters section */}
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3 animate-pulse"></div>
                            <div className="space-y-2">
                                {[...Array(3)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </aside>

            {/* Main Content Skeleton */}
            <main className="flex-1 space-y-6">
                {/* Story Header Skeleton */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>

                        {/* Stats skeleton */}
                        <div className="grid grid-cols-4 gap-4 pt-4">
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    className="text-center bg-white/50 dark:bg-gray-800/50 rounded-lg p-3"
                                >
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-1"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action Bar Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                </div>

                {/* Posts List Skeleton */}
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <div className="p-6 space-y-3 animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                    </div>
                                </div>
                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}

/**
 * Compact loading skeleton for stats only
 */
export function CommunityStatsSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
                <Card key={i} className="text-center">
                    <CardContent className="py-4">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto animate-pulse"></div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/**
 * Compact loading skeleton for stories grid only
 */
export function CommunityStoriesGridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <Card key={i}>
                    <div className="p-4 space-y-3">
                        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-4/5 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/5 animate-pulse"></div>
                        <div className="flex justify-between">
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

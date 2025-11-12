import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ComicReaderClient } from "@/components/comic/comic-reader-client";
import { MainLayout } from "@/components/layout";
import { getStoryWithComicPanels } from "@/lib/db/cached-queries";

interface ComicPageProps {
    params: Promise<{ id: string }>;
}

// ⚡ Enable Partial Prerendering (PPR) for instant static shell
export const experimental_ppr = true;

export default async function ComicPage({ params }: ComicPageProps) {
    const pageLoadStart = Date.now();
    console.log("\n🎨 [SSR] ComicPage loading started");

    const { id } = await params;
    console.log(`📚 [SSR] Loading story for comic reading: ${id}`);

    // Fetch story structure from Redis cache (SSR)
    const ssrFetchStart = Date.now();
    console.log(
        "⏳ [SSR] Fetching story structure with published comics from cache...",
    );

    // Load story with comic panels (only published comics) - with caching
    const story = await getStoryWithComicPanels(id);

    const ssrFetchDuration = Date.now() - ssrFetchStart;
    console.log(`✅ [SSR] Story structure fetched in ${ssrFetchDuration}ms`);

    if (!story) {
        console.log(`❌ [SSR] Story not found: ${id}`);
        notFound();
    }

    // Count total comic scenes available
    let totalComicScenes = 0;
    story.parts.forEach((part) => {
        part.chapters.forEach((chapter) => {
            totalComicScenes += chapter.scenes.length;
        });
    });
    story.chapters.forEach((chapter) => {
        totalComicScenes += chapter.scenes.length;
    });

    console.log(`📊 [SSR] Found ${totalComicScenes} published comic scenes`);

    if (totalComicScenes === 0) {
        console.log(`⚠️  [SSR] No published comics available for story: ${id}`);
    }

    const pageLoadDuration = Date.now() - pageLoadStart;
    console.log(
        `🏁 [SSR] ComicPage rendering complete in ${pageLoadDuration}ms\n`,
    );

    return (
        <MainLayout>
            <Suspense fallback={<ComicLoadingSkeleton />}>
                <ComicReaderClient storyId={id} initialData={story} />
            </Suspense>
        </MainLayout>
    );
}

/**
 * Loading skeleton for comic reader
 * Shown while content streams from server
 */
function ComicLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <div className="absolute inset-0 top-16 flex flex-col">
                {/* Loading Header */}
                <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between px-4 md:px-6 py-3">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                            <div className="hidden md:block h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="md:hidden h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 min-h-0 relative">
                    {/* Sidebar Loading - Hidden on mobile, visible on desktop */}
                    <div className="hidden md:block w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                        {/* Story header skeleton */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 animate-pulse">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        </div>

                        {/* Scene list skeleton */}
                        <div className="p-4 animate-pulse">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-3"></div>
                            <div className="space-y-1">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <div
                                        key={i}
                                        className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50"
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0 mt-0.5"></div>
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Loading */}
                    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                        <div className="w-full max-w-md md:max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
                            {/* Scene title skeleton */}
                            <div className="mb-6 text-center animate-pulse">
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto mb-2"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
                            </div>

                            {/* Comic panels skeleton - 3-4 panels */}
                            <div className="space-y-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="relative w-full">
                                        <div
                                            className="relative w-full"
                                            style={{ aspectRatio: "16 / 9" }}
                                        >
                                            <div className="h-full w-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

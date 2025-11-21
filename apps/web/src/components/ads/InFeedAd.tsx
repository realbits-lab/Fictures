"use client";

import { useEffect, useRef, useState } from "react";

interface InFeedAdProps {
    /**
     * AdSense In-feed ad slot ID
     * Create an In-feed ad unit in AdSense dashboard
     */
    slot: string;

    /**
     * Layout key for the in-feed ad
     * Determines how the ad blends with your content
     * Get this from AdSense when creating an in-feed ad unit
     */
    layoutKey?: string;

    /**
     * Custom CSS classes
     */
    className?: string;
}

/**
 * InFeedAd Component
 *
 * Specialized ad component that blends naturally into content feeds.
 * Designed to match the visual style of story cards in the grid.
 * Uses AdSense In-feed ad format for better integration.
 *
 * Best used in story grids, article lists, or any feed-based layout.
 *
 * @example
 * ```tsx
 * <InFeedAd
 *   slot="9876543210"
 *   layoutKey="-fb+5w+4e-db+86"
 *   className="col-span-1"
 * />
 * ```
 */
export function InFeedAd({
    slot,
    layoutKey = "-fb+5w+4e-db+86", // Default layout key
    className = "",
}: InFeedAdProps) {
    const adRef = useRef<HTMLModElement>(null);
    const [adLoaded, setAdLoaded] = useState(false);
    const adsenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;

    useEffect(() => {
        // Only load ads in production
        if (process.env.NODE_ENV !== "production" || !adsenseId) {
            return;
        }

        try {
            if (
                typeof window !== "undefined" &&
                window.adsbygoogle &&
                adRef.current
            ) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                setAdLoaded(true);
            }
        } catch (error) {
            console.error("InFeed Ad error:", error);
        }
    }, [adsenseId]);

    // Development mode: Show card-style placeholder matching story cards
    if (process.env.NODE_ENV !== "production" || !adsenseId) {
        return (
            <div
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-[1.02] hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 flex flex-col overflow-hidden ${className}`}
            >
                {/* Ad Image - 16:9 Aspect Ratio (matching story cards) */}
                <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-4xl mb-2">📢</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Advertisement
                        </div>
                    </div>
                </div>

                <div className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2 flex-shrink-0">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 truncate max-w-16">
                            Ad
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Sponsored
                        </span>
                    </div>

                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 flex-shrink-0">
                        Discover Amazing Stories
                    </h3>

                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 line-clamp-3 flex-grow overflow-hidden">
                        Explore our curated collection of engaging stories and discover your next favorite read.
                    </p>

                    <div className="text-xs text-gray-500 dark:text-gray-500 mb-3 flex-shrink-0 truncate">
                        by Advertiser
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="flex items-center gap-1 flex-shrink-0">
                                <span>👥</span>
                                <span className="truncate">0</span>
                            </span>
                            <span className="flex items-center gap-1 flex-shrink-0">
                                <span>⭐</span>
                                <span>0.0</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`in-feed-ad ${className}`}>
            {/* Skeleton matching story card */}
            {!adLoaded && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                    {/* Image skeleton */}
                    <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    {/* Content skeleton */}
                    <div className="p-4 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-2">
                            <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                        </div>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1 animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4 animate-pulse" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-1/2 animate-pulse" />
                        <div className="flex gap-2">
                            <div className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            )}

            {/* In-feed AdSense unit - wrapped in story card styling */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-[1.02] hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 flex flex-col overflow-hidden">
                <ins
                    ref={adRef}
                    className="adsbygoogle"
                    style={{ display: "block" }}
                    data-ad-client={adsenseId}
                    data-ad-slot={slot}
                    data-ad-format="fluid"
                    data-ad-layout-key={layoutKey}
                />
            </div>
        </div>
    );
}

// Extend Window interface for TypeScript
declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

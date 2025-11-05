"use client";

import { useEffect, useRef, useState } from 'react';

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
  layoutKey = '-fb+5w+4e-db+86', // Default layout key
  className = '',
}: InFeedAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const adsenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;

  useEffect(() => {
    // Only load ads in production
    if (process.env.NODE_ENV !== 'production' || !adsenseId) {
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.adsbygoogle && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      }
    } catch (error) {
      console.error('InFeed Ad error:', error);
    }
  }, [adsenseId]);

  // Development mode: Show card-style placeholder
  if (process.env.NODE_ENV !== 'production' || !adsenseId) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-dashed border-blue-300 dark:border-blue-600 p-4 flex flex-col h-[270px] ${className}`}
      >
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-2">📢</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              In-Feed Ad
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Slot: {slot}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-600 mt-2">
              (Shows in production)
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-[270px] animate-pulse">
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-400 text-sm">Loading ad...</div>
          </div>
        </div>
      )}

      {/* In-feed AdSense unit */}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adsenseId}
        data-ad-slot={slot}
        data-ad-format="fluid"
        data-ad-layout-key={layoutKey}
      />
    </div>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

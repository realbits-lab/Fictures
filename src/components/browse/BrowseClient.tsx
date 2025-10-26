"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { SkeletonLoader, Skeleton } from "@/components/ui";
import { usePublishedStories } from "@/lib/hooks/use-page-cache";
import { StoryGrid } from "./StoryGrid";
import { cacheManager } from "@/lib/hooks/use-persisted-swr";

// Skeleton component for story cards
function StoryCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col h-[270px]">
      <div className="flex justify-between items-start mb-2 flex-shrink-0">
        <Skeleton className="h-[18px] w-12 rounded-full" />
        <Skeleton className="h-[18px] w-12 rounded-full" />
      </div>
      <Skeleton className="h-5 w-4/5 mb-2 flex-shrink-0" />
      <div className="flex-grow mb-2">
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-9/10 mb-1" />
        <Skeleton className="h-3 w-7/10" />
      </div>
      <Skeleton className="h-3 w-20 mb-3 flex-shrink-0" />
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
      <Skeleton className="h-8 w-full rounded flex-shrink-0" />
    </div>
  );
}

// Skeleton section for loading state
function StoriesSkeleton() {
  return (
    <div>
      {/* Filter Skeletons - matching current responsive layout */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:justify-end items-stretch md:items-center gap-3">
          {/* First row on mobile: History/All + View toggles */}
          <div className="flex items-center justify-between md:justify-end gap-3">
            {/* History/All Toggle Skeleton */}
            <div className="inline-flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-1 flex-1 md:flex-initial">
              <Skeleton className="h-8 w-20 md:w-24 rounded" />
              <Skeleton className="h-8 w-20 md:w-24 rounded ml-1" />
            </div>

            {/* View Toggle Skeleton */}
            <div className="inline-flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-1 flex-1 md:flex-initial">
              <Skeleton className="h-8 w-16 md:w-20 rounded" />
              <Skeleton className="h-8 w-16 md:w-20 rounded ml-1" />
            </div>
          </div>

          {/* Second row on mobile: Genre + Sort selects */}
          <div className="flex items-center justify-between md:justify-end gap-3">
            {/* Genre Select Skeleton */}
            <div className="inline-flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] flex-1 md:flex-initial">
              <Skeleton className="h-9 w-32 rounded" />
            </div>

            {/* Sort Select Skeleton */}
            <div className="inline-flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] flex-1 md:flex-initial">
              <Skeleton className="h-9 w-32 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Story Grid Skeleton - starts immediately after filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <StoryCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function BrowseClient() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { data, isLoading, isValidating, error, mutate } = usePublishedStories();
  const [showCacheInfo, setShowCacheInfo] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Determine page type from pathname
  const pageType = pathname?.startsWith('/novels') ? 'novels' :
                   pathname?.startsWith('/comics') ? 'comics' : 'reading';

  // Performance tracking
  const mountTimeRef = useRef<number>(Date.now());
  const firstDataTimeRef = useRef<number | null>(null);
  const renderCountRef = useRef<number>(0);

  const stories = data?.stories || [];
  const count = data?.count || 0;

  // Get cache health status
  const cacheHealth = cacheManager.getCacheHealth(pageType);

  // Fix hydration mismatch by ensuring first render matches server
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Track component lifecycle
  useEffect(() => {
    const mountTime = mountTimeRef.current;
    console.log(`[BrowseClient] 🎬 Component mounted at ${new Date().toISOString()}`);
    console.log(`[BrowseClient] 📊 Initial state:`, {
      isLoading,
      isValidating,
      hasData: !!data,
      storiesCount: stories.length,
      hasError: !!error,
      cacheHealth,
    });

    return () => {
      const totalTime = Date.now() - mountTime;
      console.log(`[BrowseClient] 👋 Component unmounted after ${totalTime}ms`);
    };
  }, []);

  // Track data loading stages
  useEffect(() => {
    renderCountRef.current++;
    const renderNum = renderCountRef.current;
    const timeSinceMount = Date.now() - mountTimeRef.current;

    console.log(`[BrowseClient] 🔄 Render #${renderNum} (${timeSinceMount}ms since mount):`, {
      isLoading,
      isValidating,
      storiesCount: stories.length,
      hasError: !!error,
      fromCache: data?.fromCache,
      cacheHealth,
    });

    // Track first data appearance
    if (stories.length > 0 && !firstDataTimeRef.current) {
      firstDataTimeRef.current = Date.now();
      const timeToFirstData = firstDataTimeRef.current - mountTimeRef.current;
      console.log(`[BrowseClient] ⚡ First data appeared in ${timeToFirstData}ms:`, {
        storiesCount: stories.length,
        fromCache: data?.fromCache,
        source: data?.fromCache ? 'localStorage cache' : 'API fetch',
      });
    }

    // Track loading state changes
    if (!isLoading && !isValidating && stories.length > 0) {
      const totalTime = Date.now() - mountTimeRef.current;
      console.log(`[BrowseClient] ✅ Loading complete in ${totalTime}ms:`, {
        storiesCount: stories.length,
        totalCount: count,
        cacheHealth,
      });
    }
  }, [isLoading, isValidating, stories.length, data?.fromCache, error, cacheHealth, count]);

  // Track validation cycles
  useEffect(() => {
    if (isValidating && !isLoading) {
      console.log(`[BrowseClient] 🔄 Background revalidation started (${stories.length} stories visible)`);
      const startTime = Date.now();

      return () => {
        const duration = Date.now() - startTime;
        console.log(`[BrowseClient] ✅ Background revalidation completed in ${duration}ms`);
      };
    }
  }, [isValidating, isLoading, stories.length]);

  // Track errors
  useEffect(() => {
    if (error) {
      console.error(`[BrowseClient] ❌ Error occurred:`, {
        message: error.message,
        timeSinceMount: Date.now() - mountTimeRef.current,
        hadPreviousData: stories.length > 0,
      });
    }
  }, [error, stories.length]);

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <div className="container mx-auto px-4 pt-1 pb-8">
        {/* Background validation indicator in top right */}
        {isValidating && !isLoading && (
          <div className="fixed top-20 right-4 z-50 bg-[rgb(var(--background))] rounded-lg shadow-lg border border-[rgb(var(--border))] px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))]">
              <div className="w-4 h-4 border-2 border-[rgb(var(--primary)/30%)] border-t-[rgb(var(--primary))] rounded-full animate-spin" />
              <span>Refreshing stories...</span>
            </div>
          </div>
        )}

        {/* Cache status indicator - only for manager role */}
        {!isLoading && stories.length > 0 && session?.user?.role === 'manager' && (
          <div className="fixed top-20 right-4 z-40">
            <div className="flex items-center gap-2">
              {/* Cache health indicator */}
              <div 
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full cursor-pointer transition-all duration-200 hover:scale-105 ${
                  cacheHealth === 'fresh' ? 'bg-emerald-500 text-white' : 
                  cacheHealth === 'stale' ? 'bg-amber-500 text-white' : 
                  cacheHealth === 'expired' ? 'bg-red-500 text-white' : 
                  'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]'
                }`}
                onClick={() => setShowCacheInfo(!showCacheInfo)}
                title={`Cache status: ${cacheHealth} - Click for details`}
              >
                <div className="w-2 h-2 rounded-full bg-white" />
                <span className="font-medium">
                  {cacheHealth === 'fresh' ? '📦 Fresh' : 
                   cacheHealth === 'stale' ? '⏳ Stale' : 
                   cacheHealth === 'expired' ? '🔄 Expired' : '❓ Unknown'}
                </span>
              </div>
              
              {/* Cache management button */}
              <button
                onClick={() => {
                  cacheManager.clearPageCache(pageType);
                  mutate();
                }}
                className="text-xs px-2 py-1 bg-[rgb(var(--secondary))] hover:bg-[rgb(var(--secondary)/80%)] text-[rgb(var(--secondary-foreground))] rounded-full transition-colors"
                title="Clear cache and refresh"
              >
                🗑️ Clear Cache
              </button>
            </div>

            {/* Cache info panel */}
            {showCacheInfo && (
              <div className="absolute top-12 right-0 bg-[rgb(var(--background))] rounded-lg shadow-xl border border-[rgb(var(--border))] p-4 w-64 text-sm">
                <h4 className="font-medium mb-2 text-[rgb(var(--foreground))]">Cache Status</h4>
                <div className="space-y-1 text-[rgb(var(--muted-foreground))]">
                  <div>Status: <span className="font-medium text-[rgb(var(--foreground))]">{cacheHealth}</span></div>
                  <div>Stories: <span className="font-medium text-[rgb(var(--foreground))]">{stories.length}</span></div>
                  <div>TTL: <span className="font-medium text-[rgb(var(--foreground))]">1 hour</span></div>
                  <div>Source: <span className="font-medium text-[rgb(var(--foreground))]">localStorage</span></div>
                </div>
                <button
                  onClick={() => setShowCacheInfo(false)}
                  className="mt-2 text-xs text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}

        {/* Show skeleton loading while fetching */}
        {/* ⚡ OPTIMIZATION: Only show skeleton if NO data exists (not cached, not fresh) */}
        {/* If cached data exists, show it immediately even while revalidating */}
        {/* Fix hydration: always show skeleton on first render if no data */}
        {(!hasMounted || (isLoading && stories.length === 0)) ? (
          <SkeletonLoader>
            <StoriesSkeleton />
          </SkeletonLoader>
        ) : error ? (
          /* Error state */
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-[rgb(var(--foreground))] mb-2">
              Failed to load stories
            </h3>
            <p className="text-[rgb(var(--muted-foreground))] mb-4">
              {error.message || "Something went wrong while loading stories."}
            </p>
            <button 
              onClick={() => mutate()} 
              className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-lg hover:bg-[rgb(var(--primary)/80%)] transition-colors disabled:opacity-50"
              disabled={isValidating}
            >
              {isValidating ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        ) : (
          /* Success state with story grid */
          <StoryGrid stories={stories} currentUserId={session?.user?.id} pageType={pageType} />
        )}
      </div>
    </div>
  );
}
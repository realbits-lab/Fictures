"use client";

import React from "react";
import { useSession } from 'next-auth/react';
import { SkeletonLoader } from "@/components/ui";
import { usePublishedStories } from "@/lib/hooks/use-page-cache";
import { Skeleton } from "@/components/ui";
import { StoryGrid } from "./StoryGrid";

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
      {/* Filter Skeletons - immediately at the top */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-12 mr-2" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded" />
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-15 mr-2" />
          <Skeleton className="h-8 w-15" />
          <Skeleton className="h-8 w-25" />
          <Skeleton className="h-8 w-30" />
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
  const { data, isLoading, isValidating, error, mutate } = usePublishedStories();
  
  const stories = data?.stories || [];
  const count = data?.count || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">      
      <div className="container mx-auto px-4 py-8">
        {/* Background validation indicator in top right */}
        {isValidating && !isLoading && (
          <div className="fixed top-20 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              <span>Refreshing stories...</span>
            </div>
          </div>
        )}

        {/* Show skeleton loading while fetching */}
        {isLoading ? (
          <SkeletonLoader theme="light">
            <StoriesSkeleton />
          </SkeletonLoader>
        ) : error ? (
          /* Error state */
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Failed to load stories
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error.message || "Something went wrong while loading stories."}
            </p>
            <button 
              onClick={() => mutate()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isValidating}
            >
              {isValidating ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        ) : (
          /* Success state with story grid */
          <StoryGrid stories={stories} currentUserId={session?.user?.id} />
        )}
      </div>
    </div>
  );
}
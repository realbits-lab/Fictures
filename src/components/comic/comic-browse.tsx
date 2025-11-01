/**
 * Comic Browse Component
 *
 * Displays a list of stories that have comic panels available.
 * Similar to the regular Browse component but filtered for comic content.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePublishedStories } from "@/lib/hooks/use-page-cache";
import { Skeleton, SkeletonLoader } from "@/components/ui/skeleton-loader";
import { StoryGrid } from "@/components/browse/StoryGrid";
import Link from "next/link";

function ComicCardSkeleton() {
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

function ComicsSkeleton() {
  return (
    <div>
      {/* Filter Skeletons - matching current responsive layout */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:justify-end items-stretch md:items-center gap-3">
          {/* First row on mobile: History/All + View toggles */}
          <div className="flex items-center justify-between md:justify-end gap-3">
            {/* History/All Toggle Skeleton */}
            <div className="inline-flex rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] p-1 flex-1 md:flex-initial">
              <Skeleton className="h-8 w-20 md:w-24 rounded" />
              <Skeleton className="h-8 w-20 md:w-24 rounded ml-1" />
            </div>

            {/* View Toggle Skeleton */}
            <div className="inline-flex rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] p-1 flex-1 md:flex-initial">
              <Skeleton className="h-8 w-16 md:w-20 rounded" />
              <Skeleton className="h-8 w-16 md:w-20 rounded ml-1" />
            </div>
          </div>

          {/* Second row on mobile: Genre + Sort selects */}
          <div className="flex items-center justify-between md:justify-end gap-3">
            {/* Genre Select Skeleton */}
            <div className="inline-flex rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] flex-1 md:flex-initial">
              <Skeleton className="h-9 w-32 rounded" />
            </div>

            {/* Sort Select Skeleton */}
            <div className="inline-flex rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] flex-1 md:flex-initial">
              <Skeleton className="h-9 w-32 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Story Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <ComicCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ComicBrowse() {
  const { data: session } = useSession();
  const { data, isLoading, isValidating, error } = usePublishedStories();

  const stories = data?.stories || [];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--color-background))]">
        <div className="container mx-auto px-4 pt-1 pb-8">
          <SkeletonLoader>
            <ComicsSkeleton />
          </SkeletonLoader>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[rgb(var(--color-background))]">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-[rgb(var(--color-foreground))] mb-2">
              Failed to load comics
            </h3>
            <p className="text-[rgb(var(--color-muted-foreground))] mb-4">
              {error.message || "Something went wrong while loading comics."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))] rounded-lg hover:bg-[rgb(var(--color-primary)/80%)] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))]">
      <div className="container mx-auto px-4 pt-1 pb-8">
        {/* Background validation indicator in top right */}
        {isValidating && !isLoading && (
          <div className="fixed top-20 right-4 z-50 bg-[rgb(var(--color-background))] rounded-lg shadow-lg border border-[rgb(var(--color-border))] px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--color-muted-foreground))]">
              <div className="w-4 h-4 border-2 border-[rgb(var(--color-primary)/30%)] border-t-[rgb(var(--color-primary))] rounded-full animate-spin" />
              <span>Refreshing comics...</span>
            </div>
          </div>
        )}

        {/* Use StoryGrid component with comics pageType */}
        <StoryGrid stories={stories} currentUserId={session?.user?.id} pageType="comics" />
      </div>
    </div>
  );
}

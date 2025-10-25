/**
 * Webtoon Browse Component
 *
 * Displays a list of stories that have webtoon panels available.
 * Similar to the regular Browse component but filtered for webtoon content.
 */

"use client";

import React, { useState, useEffect } from "react";
import { usePublishedStories } from "@/lib/hooks/use-page-cache";
import { Skeleton } from "@/components/ui/SkeletonLoader";
import Link from "next/link";

function WebtoonCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <Skeleton className="h-48 w-full rounded-t-lg" />
      <div className="p-4">
        <Skeleton className="h-5 w-4/5 mb-2" />
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-3/4 mb-3" />
        <Skeleton className="h-8 w-full rounded" />
      </div>
    </div>
  );
}

export function WebtoonBrowse() {
  const { data, isLoading, error } = usePublishedStories();
  const [storiesWithWebtoons, setStoriesWithWebtoons] = useState<any[]>([]);

  const stories = data?.stories || [];

  // Filter stories that have webtoon panels
  useEffect(() => {
    const fetchWebtoonAvailability = async () => {
      if (!stories.length) return;

      // For now, show all published stories
      // In production, you'd check which stories have webtoon panels
      setStoriesWithWebtoons(stories);
    };

    fetchWebtoonAvailability();
  }, [stories]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <WebtoonCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
            Failed to Load Webtoons
          </h2>
          <p className="text-red-700 dark:text-red-300">
            {error.message || 'An error occurred while loading webtoons.'}
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (storiesWithWebtoons.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎨</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            No Webtoons Available Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Check back soon for webtoon adaptations of your favorite stories!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          🎨 Webtoon Gallery
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Experience stories in stunning visual webtoon format
        </p>
      </div>

      {/* Webtoon Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {storiesWithWebtoons.map((story) => (
          <Link
            key={story.id}
            href={`/webtoon/${story.id}`}
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Cover Image */}
            <div className="relative h-48 bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden">
              {story.coverImage?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={story.coverImage.url}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl">
                  📖
                </div>
              )}
              {/* Webtoon Badge */}
              <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                WEBTOON
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {story.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                {story.premise || story.summary || 'No description available'}
              </p>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span className="flex items-center gap-1">
                  {story.genre && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      {story.genre}
                    </span>
                  )}
                </span>
                <span>{story.wordCount?.toLocaleString() || 0} words</span>
              </div>

              {/* Read Button */}
              <div className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded text-center transition-colors">
                Read Webtoon
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Count */}
      {storiesWithWebtoons.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Showing {storiesWithWebtoons.length} webtoon{storiesWithWebtoons.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

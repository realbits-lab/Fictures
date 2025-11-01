/**
 * Comic Browse Component
 *
 * Displays a list of stories that have comic panels available.
 * Similar to the regular Browse component but filtered for comic content.
 */

"use client";

import React, { useState, useEffect } from "react";
import { usePublishedStories } from "@/lib/hooks/use-page-cache";
import { Skeleton } from "@/components/ui/skeleton-loader";
import { StoryCoverImage } from "@/components/optimized-image";
import Link from "next/link";

function ComicCardSkeleton() {
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

export function ComicBrowse() {
  const { data, isLoading, error } = usePublishedStories();
  const [storiesWithComics, setStoriesWithComics] = useState<any[]>([]);

  const stories = data?.stories || [];

  // Filter stories that have comic panels
  useEffect(() => {
    const fetchComicAvailability = async () => {
      if (!stories.length) return;

      // For now, show all published stories
      // In production, you'd check which stories have comic panels
      setStoriesWithComics(stories);
    };

    fetchComicAvailability();
  }, [stories]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Animated loading header */}
        <div className="mb-10 text-center">
          <div className="mb-6 flex justify-center">
            {/* Animated comic stack */}
            <div className="relative w-24 h-24">
              {/* Back comic */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-800 dark:to-purple-900 rounded-lg transform rotate-6 opacity-50 animate-pulse" style={{ animationDuration: '2s' }}></div>

              {/* Middle comic */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-200 to-pink-300 dark:from-pink-800 dark:to-pink-900 rounded-lg transform rotate-3 opacity-75 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.3s' }}></div>

              {/* Front comic with icon */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-800 dark:to-orange-900 rounded-lg shadow-xl flex items-center justify-center animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.6s' }}>
                <span className="text-4xl animate-bounce" style={{ animationDuration: '1.5s' }}>📚</span>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2 animate-pulse">
            Loading Comics Gallery
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Fetching amazing stories for you...
          </p>

          {/* Animated progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>

        {/* Skeleton grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <ComicCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Friendly illustration */}
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center shadow-2xl">
              <span className="text-6xl">🎭</span>
            </div>
          </div>

          {/* Friendly message */}
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Couldn't Load Comics Gallery
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed text-lg max-w-md mx-auto">
            We're having a little trouble fetching the comics right now.
            This is usually temporary, so please try again in a moment!
          </p>

          {/* Technical details (collapsible) */}
          <details className="mb-8 text-left max-w-md mx-auto">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-center">
              Show technical details
            </summary>
            <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
              <div className="font-mono text-xs break-words bg-white dark:bg-gray-900 p-3 rounded">
                {error.message || 'An error occurred while loading comics.'}
              </div>
            </div>
          </details>

          {/* Action button */}
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-xl transition-all font-semibold text-lg"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (storiesWithComics.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎨</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            No Comics Available Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Check back soon for comic adaptations of your favorite stories!
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
          🎨 Comic Gallery
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Experience stories in stunning visual comic format
        </p>
      </div>

      {/* Comic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {storiesWithComics.map((story) => (
          <Link
            key={story.id}
            href={`/comics/${story.id}`}
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Cover Image - Optimized with AVIF/JPEG variants */}
            <div className="relative h-48 bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden">
              {story.imageUrl || story.imageVariants ? (
                <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-300">
                  <StoryCoverImage
                    story={story}
                    className="object-cover"
                    priority={false}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl">
                  📖
                </div>
              )}
              {/* Comic Badge */}
              <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                COMIC
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {story.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                {story.description || "No description available."}
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
              </div>

              {/* Read Button */}
              <div className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded text-center transition-colors">
                Read Comic
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

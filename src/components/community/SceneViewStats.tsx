/**
 * SceneViewStats Component
 *
 * Displays most viewed scenes for community pages
 * - Shows top 5 scenes by view count
 * - Includes novel/comic breakdown
 * - Link to full analytics (for story owner)
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from '@/components/ui';
import { SceneViewBadge } from '@/components/ui/scene-view-badge';
import useSWR from 'swr';
import Link from 'next/link';

interface SceneViewStatsProps {
  storyId: string;
  showFullStats?: boolean;
  className?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SceneViewStats({
  storyId,
  showFullStats = false,
  className = '',
}: SceneViewStatsProps) {
  const { data, error, isLoading } = useSWR(
    `/api/stories/${storyId}/scene-stats?limit=5&sortBy=views`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔥 Most Viewed Scenes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.success) {
    return null;
  }

  const { scenes, stats } = data;

  if (!scenes || scenes.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔥 Most Viewed Scenes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No view data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔥 Most Viewed Scenes
        </CardTitle>
        {stats && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {stats.totalViews.toLocaleString()} total views across {stats.totalScenes} scenes
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {scenes.map((scene: any, index: number) => (
          <div
            key={scene.id}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            {/* Rank Badge */}
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : index === 1
                  ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  : index === 2
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-gray-50 text-gray-600 dark:bg-gray-900/50 dark:text-gray-500'
              }`}
            >
              {index + 1}
            </div>

            {/* Scene Info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {scene.chapter.title}, Scene {scene.sceneNumber}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                {scene.title}
              </div>
              <div className="mt-2">
                <SceneViewBadge
                  totalViews={scene.views.total}
                  novelViews={scene.views.novel}
                  comicViews={scene.views.comic}
                  mode="split"
                  size="sm"
                />
              </div>
            </div>
          </div>
        ))}

        {/* View All Link */}
        {showFullStats && (
          <Link
            href={`/analytics?story=${storyId}#scenes`}
            className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline pt-2"
          >
            View detailed analytics →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for SceneViewStats
 */
export function SceneViewStatsSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3 w-32 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

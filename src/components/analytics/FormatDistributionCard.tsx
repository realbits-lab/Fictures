/**
 * FormatDistributionCard Component
 *
 * Displays format distribution statistics for analytics
 * - Novel vs Comic view breakdown
 * - Visual progress bars
 * - Percentage and absolute numbers
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { FormatDistribution } from '@/components/ui/format-distribution';
import useSWR from 'swr';

interface FormatDistributionCardProps {
  storyId: string;
  className?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function FormatDistributionCard({
  storyId,
  className = '',
}: FormatDistributionCardProps) {
  const { data, error, isLoading } = useSWR(
    `/api/stories/${storyId}/scene-stats?limit=1`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>📈 Format Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mt-6" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.success || !data.stats) {
    return null;
  }

  const { stats } = data;
  const novelViews = stats.totalNovelViews || 0;
  const comicViews = stats.totalComicViews || 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>📈 Format Distribution</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          How readers consume your story
        </p>
      </CardHeader>
      <CardContent>
        <FormatDistribution
          novelViews={novelViews}
          comicViews={comicViews}
          showLabels={true}
          showPercentages={true}
          size="md"
        />

        {/* Additional Stats */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {novelViews.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Novel Views
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {comicViews.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Comic Views
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        {novelViews + comicViews > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {stats.formatDistribution.novel > stats.formatDistribution.comic ? (
                <>
                  📖 <strong>Novel format is more popular</strong> with {stats.formatDistribution.novel}% of readers choosing text-based reading.
                </>
              ) : stats.formatDistribution.comic > stats.formatDistribution.novel ? (
                <>
                  🎨 <strong>Comic format is more popular</strong> with {stats.formatDistribution.comic}% of readers preferring visual panels.
                </>
              ) : (
                <>
                  ⚖️ <strong>Balanced audience</strong> - readers enjoy both novel and comic formats equally.
                </>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

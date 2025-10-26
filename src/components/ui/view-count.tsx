/**
 * ViewCount Component
 *
 * Displays view count with an eye icon
 * - Formats numbers with K/M suffixes for large counts
 * - Shows unique views when available
 * - Responsive and accessible
 */

import React from 'react';
import { Eye } from 'lucide-react';

interface ViewCountProps {
  viewCount: number;
  uniqueViewCount?: number;
  showUnique?: boolean;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Format large numbers with K/M suffixes
 */
function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function ViewCount({
  viewCount,
  uniqueViewCount,
  showUnique = false,
  className = '',
  iconClassName = '',
  size = 'md',
}: ViewCountProps) {
  const displayCount = showUnique && uniqueViewCount !== undefined
    ? uniqueViewCount
    : viewCount;

  const formattedCount = formatCount(displayCount);

  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={`inline-flex items-center gap-1 text-gray-500 dark:text-gray-400 ${sizeClasses[size]} ${className}`}
      title={`${viewCount.toLocaleString()} ${showUnique && uniqueViewCount ? 'unique ' : ''}views`}
      aria-label={`${viewCount.toLocaleString()} views`}
    >
      <Eye className={`${iconSizeClasses[size]} ${iconClassName}`} aria-hidden="true" />
      <span>{formattedCount}</span>
      {showUnique && uniqueViewCount !== undefined && uniqueViewCount !== viewCount && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          ({formatCount(viewCount)})
        </span>
      )}
    </div>
  );
}

/**
 * ViewCountBadge - Badge variant for cards
 */
export function ViewCountBadge({
  viewCount,
  uniqueViewCount,
  showUnique = false,
  className = '',
}: Omit<ViewCountProps, 'size'>) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium ${className}`}
      title={`${viewCount.toLocaleString()} ${showUnique && uniqueViewCount ? 'unique ' : ''}views`}
    >
      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{formatCount(showUnique && uniqueViewCount !== undefined ? uniqueViewCount : viewCount)}</span>
    </div>
  );
}

/**
 * ViewCountSkeleton - Loading state
 */
export function ViewCountSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-3 w-12',
    md: 'h-4 w-14',
    lg: 'h-5 w-16',
  };

  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${sizeClasses[size]}`} />
  );
}

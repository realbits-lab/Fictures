/**
 * Common Story Grid Skeleton Components
 *
 * Shared skeleton loading states used across /studio, /novels, /comics, and /community pages
 * to eliminate code duplication and ensure consistent loading UX.
 */

import { Skeleton } from "@/components/ui";

/**
 * Story Card Skeleton
 *
 * Skeleton for individual story cards in grid view.
 * Used across studio, novels, comics, and community pages.
 */
export function StoryCardSkeleton() {
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

interface StoryGridSkeletonProps {
	/** Whether to show filter controls (history/all, view toggle, genre, sort) */
	showFilters?: boolean;
	/** Number of skeleton cards to display */
	cardCount?: number;
}

/**
 * Story Grid Skeleton with Filters
 *
 * Complete skeleton for the story grid including optional filter controls.
 * Used across studio, novels, comics, and community pages.
 *
 * @param showFilters - Whether to show the filter skeleton (default: true)
 * @param cardCount - Number of skeleton cards to show (default: 12)
 *
 * @example
 * // With filters (novels, comics, community)
 * <StoryGridSkeleton showFilters={true} />
 *
 * @example
 * // Without filters (studio)
 * <StoryGridSkeleton showFilters={false} cardCount={6} />
 */
export function StoryGridSkeleton({
	showFilters = true,
	cardCount = 12,
}: StoryGridSkeletonProps) {
	return (
		<div>
			{/* Filter Skeletons - matching current responsive layout */}
			{showFilters && (
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
			)}

			{/* Story Grid Skeleton */}
			<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{Array.from({ length: cardCount }).map((_, i) => (
					<StoryCardSkeleton key={i} />
				))}
			</div>
		</div>
	);
}

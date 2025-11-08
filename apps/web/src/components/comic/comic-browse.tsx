/**
 * Comic Browse Component
 *
 * Displays a list of stories that have comic panels available.
 * Similar to the regular Browse component but filtered for comic content.
 */

"use client";

import { useSession } from "next-auth/react";
import React from "react";
import { StoryGrid } from "@/components/browse/StoryGrid";
import {
	BackgroundValidationIndicator,
	StoryGridSkeleton,
	StoryLoadingError,
} from "@/components/common";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";
import { usePublishedStories } from "@/lib/hooks/use-page-cache";

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
						<StoryGridSkeleton showFilters={true} cardCount={12} />
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
					<StoryLoadingError
						title="Failed to load comics"
						message={
							error.message || "Something went wrong while loading comics."
						}
						onRetry={() => window.location.reload()}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[rgb(var(--color-background))]">
			<div className="container mx-auto px-4 pt-1 pb-8">
				{/* Background validation indicator in top right */}
				{isValidating && !isLoading && (
					<BackgroundValidationIndicator text="Refreshing comics..." />
				)}

				{/* Use StoryGrid component with comics pageType */}
				<StoryGrid
					stories={stories}
					currentUserId={session?.user?.id}
					pageType="comics"
				/>
			</div>
		</div>
	);
}

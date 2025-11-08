/**
 * ViewCount Component
 *
 * Displays view count with an eye icon
 * - Formats numbers with K/M suffixes for large counts
 * - Shows unique views when available
 * - Responsive and accessible
 */

import { Eye } from "lucide-react";
import React from "react";

interface ViewCountProps {
	viewCount: number;
	uniqueViewCount?: number;
	showUnique?: boolean;
	// Format-specific counts (optional)
	novelViewCount?: number;
	novelUniqueViewCount?: number;
	comicViewCount?: number;
	comicUniqueViewCount?: number;
	// Display mode
	displayMode?: "total" | "novel" | "comic" | "split";
	className?: string;
	iconClassName?: string;
	size?: "sm" | "md" | "lg";
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatCount(count: number): string {
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
	novelViewCount,
	novelUniqueViewCount,
	comicViewCount,
	comicUniqueViewCount,
	displayMode = "total",
	className = "",
	iconClassName = "",
	size = "md",
}: ViewCountProps) {
	// Size classes
	const sizeClasses = {
		sm: "text-xs",
		md: "text-sm",
		lg: "text-base",
	};

	const iconSizeClasses = {
		sm: "w-3 h-3",
		md: "w-4 h-4",
		lg: "w-5 h-5",
	};

	// Determine which count to display based on mode
	let displayCount: number;
	let labelText: string;

	switch (displayMode) {
		case "novel":
			displayCount =
				showUnique && novelUniqueViewCount !== undefined
					? novelUniqueViewCount
					: (novelViewCount ?? viewCount);
			labelText = `${displayCount.toLocaleString()} novel ${showUnique ? "unique " : ""}views`;
			break;
		case "comic":
			displayCount =
				showUnique && comicUniqueViewCount !== undefined
					? comicUniqueViewCount
					: (comicViewCount ?? viewCount);
			labelText = `${displayCount.toLocaleString()} comic ${showUnique ? "unique " : ""}views`;
			break;
		case "split": {
			// Show both novel and comic counts
			const novelCount = showUnique
				? (novelUniqueViewCount ?? 0)
				: (novelViewCount ?? 0);
			const comicCount = showUnique
				? (comicUniqueViewCount ?? 0)
				: (comicViewCount ?? 0);
			return (
				<div
					className={`inline-flex items-center gap-2 ${sizeClasses[size]} ${className}`}
				>
					<div
						className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400"
						title={`${novelCount.toLocaleString()} novel ${showUnique ? "unique " : ""}views`}
					>
						<Eye
							className={`${iconSizeClasses[size]} ${iconClassName}`}
							aria-hidden="true"
						/>
						<span>📖 {formatCount(novelCount)}</span>
					</div>
					<div
						className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400"
						title={`${comicCount.toLocaleString()} comic ${showUnique ? "unique " : ""}views`}
					>
						<Eye
							className={`${iconSizeClasses[size]} ${iconClassName}`}
							aria-hidden="true"
						/>
						<span>🎨 {formatCount(comicCount)}</span>
					</div>
				</div>
			);
		}
		case "total":
		default:
			displayCount =
				showUnique && uniqueViewCount !== undefined
					? uniqueViewCount
					: viewCount;
			labelText = `${viewCount.toLocaleString()} ${showUnique && uniqueViewCount ? "unique " : ""}views`;
			break;
	}

	const formattedCount = formatCount(displayCount);

	return (
		<div
			className={`inline-flex items-center gap-1 text-gray-500 dark:text-gray-400 ${sizeClasses[size]} ${className}`}
			title={labelText}
			aria-label={labelText}
		>
			<Eye
				className={`${iconSizeClasses[size]} ${iconClassName}`}
				aria-hidden="true"
			/>
			<span>{formattedCount}</span>
			{showUnique &&
				uniqueViewCount !== undefined &&
				uniqueViewCount !== viewCount &&
				displayMode === "total" && (
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
	novelViewCount,
	novelUniqueViewCount,
	comicViewCount,
	comicUniqueViewCount,
	displayMode = "total",
	className = "",
}: Omit<ViewCountProps, "size" | "iconClassName">) {
	// Determine which count to display based on mode
	let displayCount: number;

	switch (displayMode) {
		case "novel":
			displayCount =
				showUnique && novelUniqueViewCount !== undefined
					? novelUniqueViewCount
					: (novelViewCount ?? viewCount);
			break;
		case "comic":
			displayCount =
				showUnique && comicUniqueViewCount !== undefined
					? comicUniqueViewCount
					: (comicViewCount ?? viewCount);
			break;
		case "split": {
			// Show both novel and comic counts
			const novelCount = showUnique
				? (novelUniqueViewCount ?? 0)
				: (novelViewCount ?? 0);
			const comicCount = showUnique
				? (comicUniqueViewCount ?? 0)
				: (comicViewCount ?? 0);
			return (
				<div className={`inline-flex items-center gap-2 ${className}`}>
					<div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium">
						<Eye className="w-3.5 h-3.5" aria-hidden="true" />
						<span>📖 {formatCount(novelCount)}</span>
					</div>
					<div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium">
						<Eye className="w-3.5 h-3.5" aria-hidden="true" />
						<span>🎨 {formatCount(comicCount)}</span>
					</div>
				</div>
			);
		}
		case "total":
		default:
			displayCount =
				showUnique && uniqueViewCount !== undefined
					? uniqueViewCount
					: viewCount;
			break;
	}

	return (
		<div
			className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium ${className}`}
			title={`${displayCount.toLocaleString()} ${showUnique ? "unique " : ""}views`}
		>
			<Eye className="w-3.5 h-3.5" aria-hidden="true" />
			<span>{formatCount(displayCount)}</span>
		</div>
	);
}

/**
 * ViewCountSkeleton - Loading state
 */
export function ViewCountSkeleton({
	size = "md",
}: {
	size?: "sm" | "md" | "lg";
}) {
	const sizeClasses = {
		sm: "h-3 w-12",
		md: "h-4 w-14",
		lg: "h-5 w-16",
	};

	return (
		<div
			className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${sizeClasses[size]}`}
		/>
	);
}

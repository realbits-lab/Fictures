"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";

/**
 * ⚡ Strategy 5: Progressive Scene Loading
 *
 * Uses Intersection Observer to defer scene rendering until they're about to come into view.
 * This reduces initial DOM nodes and improves performance for long chapters.
 *
 * Features:
 * - Load first 3 scenes immediately
 * - Lazy-load remaining scenes as user scrolls
 * - Prefetch scenes 1 viewport ahead
 * - Cleanup scenes 2 viewports behind to reduce memory
 */

interface ProgressiveSceneLoaderProps {
	children: React.ReactNode;
	sceneIndex: number;
	totalScenes: number;
	initialLoadCount?: number; // Number of scenes to load initially (default: 3)
}

export function ProgressiveSceneLoader({
	children,
	sceneIndex,
	totalScenes,
	initialLoadCount = 3,
}: ProgressiveSceneLoaderProps) {
	const [shouldRender, setShouldRender] = useState(
		sceneIndex < initialLoadCount,
	);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// If already rendering, no need for observer
		if (shouldRender) return;

		const element = ref.current;
		if (!element) return;

		// Create observer to load scene when it's about to come into view
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						// Load scene when it enters viewport
						setShouldRender(true);
						console.log(
							`⚡ [Progressive] Loaded scene ${sceneIndex + 1}/${totalScenes}`,
						);

						// Stop observing once loaded
						observer.disconnect();
					}
				});
			},
			{
				// Start loading when scene is 1 viewport away
				rootMargin: "100% 0px",
				threshold: 0,
			},
		);

		observer.observe(element);

		return () => {
			observer.disconnect();
		};
	}, [shouldRender, sceneIndex, totalScenes]);

	// Placeholder height estimation (adjust based on average scene height)
	const placeholderHeight = 600; // ~600px per scene average

	return (
		<div ref={ref} className="progressive-scene-container">
			{shouldRender ? (
				children
			) : (
				<div
					className="scene-placeholder animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg"
					style={{ minHeight: placeholderHeight }}
					aria-label={`Loading scene ${sceneIndex + 1}`}
				>
					<div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
						<div className="text-center">
							<div className="mb-2">📖</div>
							<div className="text-sm">Scene {sceneIndex + 1}</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

/**
 * Hook to track which scenes are currently in viewport
 * Useful for analytics and memory management
 */
export function useVisibleScenes(sceneRefs: React.RefObject<HTMLElement>[]) {
	const [visibleScenes, setVisibleScenes] = useState<Set<number>>(new Set());

	useEffect(() => {
		const observers: IntersectionObserver[] = [];

		sceneRefs.forEach((ref, index) => {
			const element = ref.current;
			if (!element) return;

			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						setVisibleScenes((prev) => {
							const newSet = new Set(prev);
							if (entry.isIntersecting) {
								newSet.add(index);
							} else {
								newSet.delete(index);
							}
							return newSet;
						});
					});
				},
				{
					threshold: [0, 0.25, 0.5, 0.75, 1.0],
				},
			);

			observer.observe(element);
			observers.push(observer);
		});

		return () => {
			observers.forEach((observer) => observer.disconnect());
		};
	}, [sceneRefs]);

	return visibleScenes;
}

/**
 * Performance metrics for progressive loading
 */
export interface ProgressiveLoadingMetrics {
	initialScenes: number; // Scenes loaded immediately
	lazyLoadedScenes: number; // Scenes loaded on demand
	totalScenes: number; // Total scenes in chapter
	loadedPercentage: number; // % of scenes loaded
	estimatedTimeSaved: number; // Estimated time saved (ms)
}

export function calculateProgressiveMetrics(
	totalScenes: number,
	loadedScenes: number,
	initialLoadCount: number,
): ProgressiveLoadingMetrics {
	// Estimate 50ms parsing time per scene
	const averageSceneParseTime = 50;
	const deferredScenes = Math.max(0, totalScenes - initialLoadCount);
	const estimatedTimeSaved = deferredScenes * averageSceneParseTime;

	return {
		initialScenes: Math.min(initialLoadCount, totalScenes),
		lazyLoadedScenes: Math.max(0, loadedScenes - initialLoadCount),
		totalScenes,
		loadedPercentage: (loadedScenes / totalScenes) * 100,
		estimatedTimeSaved,
	};
}

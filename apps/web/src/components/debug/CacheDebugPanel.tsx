"use client";

/**
 * Unified Cache Debug Panel
 *
 * Visual debugging tool for cache performance with all controls.
 * Shows real-time cache metrics, hit rates, and recent operations.
 *
 * Features:
 * - Cache metrics display
 * - Clear SWR cache
 * - Clear localStorage
 * - Clear all caches
 *
 * Usage:
 *   <CacheDebugPanel />
 *
 * Note: Only available in development mode (NODE_ENV=development)
 *
 * Keyboard shortcut: Ctrl+Shift+D to toggle visibility
 */

import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useCacheInvalidation } from "@/hooks/use-cache-invalidation";
import { cacheMetrics } from "@/lib/cache/cache-metrics";

export function CacheDebugPanel() {
	const [stats, setStats] = useState(() => cacheMetrics.getStats());
	const [isVisible, setIsVisible] = useState(false);
	const { invalidateAll } = useCacheInvalidation();
	const { cache, mutate } = useSWRConfig();

	// Only render in development mode
	const isDevelopment = process.env.NODE_ENV === "development";

	// Update stats every 2 seconds
	useEffect(() => {
		if (!isDevelopment) return;

		const interval = setInterval(() => {
			setStats(cacheMetrics.getStats());
		}, 2000);

		return () => clearInterval(interval);
	}, [isDevelopment]);

	// Keyboard shortcut: Ctrl+Shift+D to toggle
	useEffect(() => {
		if (!isDevelopment) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.shiftKey && e.key === "D") {
				e.preventDefault();
				setIsVisible((prev) => !prev);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isDevelopment]);

	// Clear SWR cache
	const clearSWRCache = () => {
		// Clear all SWR cache entries
		if (cache instanceof Map) {
			cache.clear();
		}
		// Revalidate all keys
		mutate(() => true, undefined, { revalidate: false });
		alert("SWR cache cleared!");
	};

	// Clear localStorage
	const clearLocalStorage = () => {
		const count = localStorage.length;
		localStorage.clear();
		alert(`localStorage cleared! (${count} items removed)`);
	};

	// Clear sessionStorage
	const clearSessionStorage = () => {
		const count = sessionStorage.length;
		sessionStorage.clear();
		alert(`sessionStorage cleared! (${count} items removed)`);
	};

	// Clear all
	const clearAll = () => {
		// Clear metrics
		cacheMetrics.clear();
		setStats(cacheMetrics.getStats());

		// Clear SWR
		if (cache instanceof Map) {
			cache.clear();
		}
		mutate(() => true, undefined, { revalidate: false });

		// Clear localStorage
		localStorage.clear();

		// Clear sessionStorage
		sessionStorage.clear();

		// Clear other caches
		invalidateAll();

		alert("All caches cleared!");
	};

	// Don't render anything in production
	if (!isDevelopment) {
		return null;
	}

	if (!isVisible) {
		return null; // Hidden by default, toggle with Ctrl+Shift+D
	}

	return (
		<div className="fixed bottom-4 right-4 z-50 w-[420px] max-h-[600px] overflow-auto bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">
						🔧 Debug Panel
					</CardTitle>
					<button
						type="button"
						onClick={() => setIsVisible(false)}
						className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
					>
						✕
					</button>
				</CardHeader>
				<CardContent className="text-xs space-y-4">
					{/* Action Buttons */}
					<div className="grid grid-cols-2 gap-2">
						<button
							type="button"
							onClick={clearSWRCache}
							className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs font-medium"
						>
							🔄 Clear SWR
						</button>
						<button
							type="button"
							onClick={clearLocalStorage}
							className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-xs font-medium"
						>
							💾 Clear LocalStorage
						</button>
						<button
							type="button"
							onClick={clearSessionStorage}
							className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-xs font-medium"
						>
							📦 Clear SessionStorage
						</button>
						<button
							type="button"
							onClick={() => {
								cacheMetrics.clear();
								setStats(cacheMetrics.getStats());
								alert("Metrics cleared!");
							}}
							className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs font-medium"
						>
							📊 Clear Metrics
						</button>
						<button
							type="button"
							onClick={() => {
								invalidateAll();
								alert("Redis/Server caches cleared!");
							}}
							className="px-3 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 text-xs font-medium"
						>
							🗄️ Clear Server Cache
						</button>
						<button
							type="button"
							onClick={clearAll}
							className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
						>
							🧹 Clear ALL
						</button>
					</div>

					{/* Overall Stats */}
					<div className="border-t border-gray-200 dark:border-gray-700 pt-3">
						<h3 className="font-semibold mb-2">Cache Metrics</h3>
						<div className="grid grid-cols-3 gap-2">
							<div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
								<div className="text-gray-500 dark:text-gray-400 text-xs">
									Hit Rate
								</div>
								<div className="text-lg font-bold text-green-600">
									{(stats.hitRate * 100).toFixed(1)}%
								</div>
							</div>
							<div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
								<div className="text-gray-500 dark:text-gray-400 text-xs">
									Hits
								</div>
								<div className="text-lg font-bold text-blue-600">
									{stats.totalHits}
								</div>
							</div>
							<div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
								<div className="text-gray-500 dark:text-gray-400 text-xs">
									Misses
								</div>
								<div className="text-lg font-bold text-orange-600">
									{stats.totalMisses}
								</div>
							</div>
						</div>
					</div>

					{/* Cache Keys */}
					<div>
						<h3 className="font-semibold mb-2">
							Recent Cache Keys ({stats.metrics.length})
						</h3>
						<div className="space-y-1 max-h-32 overflow-auto">
							{stats.metrics.slice(-8).map((metric) => (
								<div
									key={metric.key}
									className="p-2 rounded text-xs bg-gray-50 dark:bg-gray-800"
								>
									<div className="flex justify-between items-start">
										<span className="font-mono truncate max-w-[280px]">
											{metric.key}
										</span>
										<span className="text-gray-500 whitespace-nowrap ml-2">
											{metric.hits}h / {metric.misses}m
										</span>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Legend */}
					<div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
						<div>
							Press{" "}
							<kbd className="px-1 bg-gray-200 dark:bg-gray-700 rounded">
								Ctrl+Shift+D
							</kbd>{" "}
							to toggle
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

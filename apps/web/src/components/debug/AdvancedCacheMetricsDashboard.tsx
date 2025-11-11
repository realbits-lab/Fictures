/**
 * Advanced Cache Metrics Dashboard
 *
 * Comprehensive cache performance monitoring dashboard.
 * Shows real-time metrics, trends, and detailed analytics.
 *
 * Usage:
 *   <AdvancedCacheMetricsDashboard />
 *
 * Note: Only available in development mode (NODE_ENV=development)
 *
 * Features:
 * - Real-time metrics streaming
 * - Time range filtering (1h, 6h, 24h, 7d, 30d)
 * - Multiple grouping options (cache type, operation, hour, day)
 * - Visual charts and graphs
 * - Detailed operation logs
 * - Export metrics as JSON/CSV
 */

"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

/**
 * Time range options
 */
type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d" | "all";

/**
 * Group by options
 */
type GroupBy = "cacheType" | "operation" | "hour" | "day";

/**
 * Metrics API response type
 */
interface MetricsResponse {
	timeRange: TimeRange;
	groupBy: GroupBy;
	summary: {
		totalHits: number;
		totalMisses: number;
		hitRate: number;
		averageDuration: number;
		totalMetrics: number;
	};
	byType: Record<
		string,
		{
			hits: number;
			misses: number;
			invalidations: number;
			hitRate: number;
		}
	>;
	grouped: Record<string, unknown>;
	recentOperations: Array<{
		cacheType: string;
		operation: string;
		key: string;
		duration?: number;
		timestamp: number;
	}>;
}

/**
 * Fetcher for SWR
 */
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Format number with thousands separator
 */
function formatNumber(num: number): string {
	return new Intl.NumberFormat().format(num);
}

/**
 * Format percentage
 */
function formatPercentage(value: number): string {
	return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format duration in ms
 */
function formatDuration(ms: number): string {
	return `${ms.toFixed(1)}ms`;
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp: number): string {
	return new Date(timestamp).toLocaleTimeString();
}

export function AdvancedCacheMetricsDashboard() {
	const [isVisible, setIsVisible] = useState(false);
	const [timeRange, setTimeRange] = useState<TimeRange>("24h");
	const [groupBy, setGroupBy] = useState<GroupBy>("cacheType");

	// Fetch metrics with auto-refresh every 5 seconds
	const { data, error, mutate } = useSWR<MetricsResponse>(
		isVisible
			? `/studio/api/cache/metrics?timeRange=${timeRange}&groupBy=${groupBy}`
			: null,
		fetcher,
		{
			refreshInterval: 5000,
			revalidateOnFocus: true,
		},
	);

	// Keyboard shortcut: Ctrl+Shift+M to toggle
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.shiftKey && e.key === "M") {
				e.preventDefault();
				setIsVisible((prev) => !prev);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	/**
	 * Export metrics as JSON
	 */
	const exportAsJSON = () => {
		if (!data) return;

		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `cache-metrics-${timeRange}-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	/**
	 * Export metrics as CSV
	 */
	const exportAsCSV = () => {
		if (!data) return;

		// Build CSV from recent operations
		const headers = [
			"Timestamp",
			"Cache Type",
			"Operation",
			"Key",
			"Duration (ms)",
		];
		const rows = data.recentOperations.map((op) => [
			new Date(op.timestamp).toISOString(),
			op.cacheType,
			op.operation,
			op.key,
			op.duration?.toFixed(2) || "N/A",
		]);

		const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `cache-metrics-${timeRange}-${Date.now()}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	/**
	 * Clear all metrics
	 */
	const clearMetrics = async () => {
		if (!confirm("Are you sure you want to clear all cache metrics?")) {
			return;
		}

		try {
			await fetch("/studio/api/cache/metrics", { method: "DELETE" });
			mutate();
			alert("Cache metrics cleared successfully");
		} catch (error) {
			alert("Failed to clear cache metrics");
			console.error(error);
		}
	};

	if (!isVisible) {
		return (
			<button
				onClick={() => setIsVisible(true)}
				className="fixed bottom-20 right-4 z-50 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg shadow-lg hover:bg-blue-700"
				title="Show Advanced Metrics Dashboard (Ctrl+Shift+M)"
			>
				📊 Metrics
			</button>
		);
	}

	if (error) {
		return (
			<div className="fixed bottom-4 right-4 z-50 w-[800px] bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4">
				<p className="text-red-700 dark:text-red-300">
					Failed to load metrics: {error.message}
				</p>
				<button
					onClick={() => setIsVisible(false)}
					className="mt-2 text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
				>
					Close
				</button>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="fixed bottom-4 right-4 z-50 w-[800px] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
				<p className="text-gray-600 dark:text-gray-400">Loading metrics...</p>
			</div>
		);
	}

	return (
		<div className="fixed bottom-4 right-4 z-50 w-[800px] max-h-[700px] overflow-auto bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-base font-medium">
						Advanced Cache Metrics Dashboard
					</CardTitle>
					<div className="flex gap-2">
						<button
							onClick={exportAsJSON}
							className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
							title="Export as JSON"
						>
							JSON
						</button>
						<button
							onClick={exportAsCSV}
							className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
							title="Export as CSV"
						>
							CSV
						</button>
						<button
							onClick={clearMetrics}
							className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
							title="Clear all metrics"
						>
							Clear
						</button>
						<button
							onClick={() => mutate()}
							className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
							title="Refresh metrics"
						>
							↻
						</button>
						<button
							onClick={() => setIsVisible(false)}
							className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
						>
							✕
						</button>
					</div>
				</CardHeader>
				<CardContent className="text-xs space-y-4">
					{/* Filters */}
					<div className="flex gap-4 items-center border-b border-gray-200 dark:border-gray-700 pb-3">
						<div className="flex gap-2 items-center">
							<label className="text-gray-600 dark:text-gray-400">
								Time Range:
							</label>
							<select
								value={timeRange}
								onChange={(e) => setTimeRange(e.target.value as TimeRange)}
								className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
							>
								<option value="1h">Last 1 Hour</option>
								<option value="6h">Last 6 Hours</option>
								<option value="24h">Last 24 Hours</option>
								<option value="7d">Last 7 Days</option>
								<option value="30d">Last 30 Days</option>
								<option value="all">All Time</option>
							</select>
						</div>

						<div className="flex gap-2 items-center">
							<label className="text-gray-600 dark:text-gray-400">
								Group By:
							</label>
							<select
								value={groupBy}
								onChange={(e) => setGroupBy(e.target.value as GroupBy)}
								className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
							>
								<option value="cacheType">Cache Type</option>
								<option value="operation">Operation</option>
								<option value="hour">Hour</option>
								<option value="day">Day</option>
							</select>
						</div>
					</div>

					{/* Summary Stats */}
					<div className="grid grid-cols-5 gap-2">
						<div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded">
							<div className="text-gray-500 dark:text-gray-400">Hit Rate</div>
							<div className="text-2xl font-bold text-green-600">
								{formatPercentage(data.summary.hitRate)}
							</div>
						</div>

						<div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded">
							<div className="text-gray-500 dark:text-gray-400">
								Avg Duration
							</div>
							<div className="text-2xl font-bold text-blue-600">
								{formatDuration(data.summary.averageDuration)}
							</div>
						</div>

						<div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded">
							<div className="text-gray-500 dark:text-gray-400">Total Hits</div>
							<div className="text-2xl font-bold text-purple-600">
								{formatNumber(data.summary.totalHits)}
							</div>
						</div>

						<div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded">
							<div className="text-gray-500 dark:text-gray-400">
								Total Misses
							</div>
							<div className="text-2xl font-bold text-orange-600">
								{formatNumber(data.summary.totalMisses)}
							</div>
						</div>

						<div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded">
							<div className="text-gray-500 dark:text-gray-400">Operations</div>
							<div className="text-2xl font-bold text-gray-600">
								{formatNumber(data.summary.totalMetrics)}
							</div>
						</div>
					</div>

					{/* By Cache Type */}
					<div>
						<h3 className="font-semibold mb-2">By Cache Type</h3>
						<div className="space-y-2">
							{Object.entries(data.byType).map(([type, stats]) => (
								<div
									key={type}
									className="p-3 bg-gray-50 dark:bg-gray-800 rounded"
								>
									<div className="flex justify-between items-center mb-2">
										<span className="font-medium capitalize">{type}</span>
										<span className="text-green-600 font-bold text-base">
											{formatPercentage(stats.hitRate)}
										</span>
									</div>
									<div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
										<div>
											<span className="text-green-600">Hits:</span>{" "}
											{formatNumber(stats.hits)}
										</div>
										<div>
											<span className="text-orange-600">Misses:</span>{" "}
											{formatNumber(stats.misses)}
										</div>
										<div>
											<span className="text-red-600">Invalidations:</span>{" "}
											{formatNumber(stats.invalidations)}
										</div>
									</div>

									{/* Visual hit rate bar */}
									<div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
										<div
											className="h-full bg-green-500"
											style={{ width: `${stats.hitRate * 100}%` }}
										/>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Recent Operations */}
					<div>
						<h3 className="font-semibold mb-2">Recent Operations (Last 50)</h3>
						<div className="space-y-1 max-h-60 overflow-auto">
							{data.recentOperations.map((op, index) => (
								<div
									key={index}
									className={`p-2 rounded text-xs ${
										op.operation === "hit"
											? "bg-green-50 dark:bg-green-900/20"
											: op.operation === "miss"
												? "bg-yellow-50 dark:bg-yellow-900/20"
												: op.operation === "invalidate"
													? "bg-red-50 dark:bg-red-900/20"
													: "bg-blue-50 dark:bg-blue-900/20"
									}`}
								>
									<div className="flex justify-between items-start">
										<span className="font-mono">
											<span
												className={`inline-block px-1 rounded mr-1 ${
													op.operation === "hit"
														? "bg-green-200 dark:bg-green-800"
														: op.operation === "miss"
															? "bg-yellow-200 dark:bg-yellow-800"
															: op.operation === "invalidate"
																? "bg-red-200 dark:bg-red-800"
																: "bg-blue-200 dark:bg-blue-800"
												}`}
											>
												{op.operation.toUpperCase()}
											</span>
											{op.cacheType}
										</span>
										<div className="flex gap-2 items-center">
											{op.duration && (
												<span className="text-gray-500">
													{formatDuration(op.duration)}
												</span>
											)}
											<span className="text-gray-400 text-xs">
												{formatTimestamp(op.timestamp)}
											</span>
										</div>
									</div>
									<div className="text-gray-600 dark:text-gray-400 truncate mt-1 font-mono">
										{op.key}
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
								Ctrl+Shift+M
							</kbd>{" "}
							to toggle
						</div>
						<div className="text-xs text-gray-400 mt-1">
							Auto-refreshes every 5 seconds
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

/**
 * Cache Metrics API
 *
 * Provides comprehensive cache performance metrics and analytics.
 * Used by the advanced metrics dashboard for real-time monitoring.
 *
 * GET /studio/api/cache/metrics
 * GET /studio/api/cache/metrics?timeRange=1h&groupBy=cacheType
 */

import { type NextRequest, NextResponse } from "next/server";
import { cacheMetrics } from "@/lib/cache/cache-metrics";

/**
 * Time range options
 */
type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d" | "all";

/**
 * Group by options
 */
type GroupBy = "cacheType" | "operation" | "hour" | "day";

/**
 * Parse time range to milliseconds
 */
function parseTimeRange(range: TimeRange): number {
	switch (range) {
		case "1h":
			return 60 * 60 * 1000;
		case "6h":
			return 6 * 60 * 60 * 1000;
		case "24h":
			return 24 * 60 * 60 * 1000;
		case "7d":
			return 7 * 24 * 60 * 60 * 1000;
		case "30d":
			return 30 * 24 * 60 * 60 * 1000;
		case "all":
		default:
			return Infinity;
	}
}

/**
 * GET /studio/api/cache/metrics
 *
 * Returns comprehensive cache metrics with optional filtering and grouping.
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const timeRange = (searchParams.get("timeRange") as TimeRange) || "24h";
		const groupBy = (searchParams.get("groupBy") as GroupBy) || "cacheType";

		// Get raw stats from cache metrics
		const stats = cacheMetrics.getStats();

		// Calculate time cutoff
		const cutoffTime = Date.now() - parseTimeRange(timeRange);

		// Filter metrics by time range
		const filteredMetrics = stats.recentMetrics.filter(
			(metric) => metric.timestamp >= cutoffTime,
		);

		// Build response based on groupBy parameter
		let groupedData: Record<string, unknown> = {};

		switch (groupBy) {
			case "cacheType": {
				// Group by cache type (redis, localStorage, swr)
				const typeGroups: Record<
					string,
					{
						hits: number;
						misses: number;
						invalidations: number;
						sets: number;
						hitRate: number;
						avgDuration: number;
					}
				> = {};

				filteredMetrics.forEach((metric) => {
					if (!typeGroups[metric.cacheType]) {
						typeGroups[metric.cacheType] = {
							hits: 0,
							misses: 0,
							invalidations: 0,
							sets: 0,
							hitRate: 0,
							avgDuration: 0,
						};
					}

					const group = typeGroups[metric.cacheType];

					switch (metric.operation) {
						case "hit":
							group.hits++;
							break;
						case "miss":
							group.misses++;
							break;
						case "invalidate":
							group.invalidations++;
							break;
						case "set":
							group.sets++;
							break;
					}

					if (metric.duration) {
						group.avgDuration =
							(group.avgDuration * (group.hits + group.misses) +
								metric.duration) /
							(group.hits + group.misses + 1);
					}
				});

				// Calculate hit rates
				Object.keys(typeGroups).forEach((type) => {
					const group = typeGroups[type];
					const total = group.hits + group.misses;
					group.hitRate = total > 0 ? group.hits / total : 0;
				});

				groupedData = typeGroups;
				break;
			}

			case "operation": {
				// Group by operation type
				const opGroups: Record<string, number> = {
					hit: 0,
					miss: 0,
					invalidate: 0,
					set: 0,
				};

				filteredMetrics.forEach((metric) => {
					opGroups[metric.operation]++;
				});

				groupedData = opGroups;
				break;
			}

			case "hour": {
				// Group by hour
				const hourGroups: Record<
					string,
					{ hits: number; misses: number; hitRate: number }
				> = {};

				filteredMetrics.forEach((metric) => {
					const hour = new Date(metric.timestamp).toISOString().slice(0, 13);

					if (!hourGroups[hour]) {
						hourGroups[hour] = { hits: 0, misses: 0, hitRate: 0 };
					}

					if (metric.operation === "hit") {
						hourGroups[hour].hits++;
					} else if (metric.operation === "miss") {
						hourGroups[hour].misses++;
					}
				});

				// Calculate hit rates
				Object.keys(hourGroups).forEach((hour) => {
					const group = hourGroups[hour];
					const total = group.hits + group.misses;
					group.hitRate = total > 0 ? group.hits / total : 0;
				});

				groupedData = hourGroups;
				break;
			}

			case "day": {
				// Group by day
				const dayGroups: Record<
					string,
					{ hits: number; misses: number; hitRate: number }
				> = {};

				filteredMetrics.forEach((metric) => {
					const day = new Date(metric.timestamp).toISOString().slice(0, 10);

					if (!dayGroups[day]) {
						dayGroups[day] = { hits: 0, misses: 0, hitRate: 0 };
					}

					if (metric.operation === "hit") {
						dayGroups[day].hits++;
					} else if (metric.operation === "miss") {
						dayGroups[day].misses++;
					}
				});

				// Calculate hit rates
				Object.keys(dayGroups).forEach((day) => {
					const group = dayGroups[day];
					const total = group.hits + group.misses;
					group.hitRate = total > 0 ? group.hits / total : 0;
				});

				groupedData = dayGroups;
				break;
			}
		}

		// Build comprehensive response
		const response = {
			timeRange,
			groupBy,
			summary: {
				totalHits: stats.totalHits,
				totalMisses: stats.totalMisses,
				hitRate: stats.hitRate,
				averageDuration: stats.averageDuration,
				totalMetrics: filteredMetrics.length,
			},
			byType: stats.byType,
			grouped: groupedData,
			recentOperations: filteredMetrics.slice(-50).reverse(), // Last 50 operations
		};

		return NextResponse.json(response, {
			headers: {
				"Cache-Control": "no-store, must-revalidate",
			},
		});
	} catch (error) {
		console.error("[Cache Metrics API] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch cache metrics" },
			{ status: 500 },
		);
	}
}

/**
 * DELETE /studio/api/cache/metrics
 *
 * Clears all cache metrics (admin only).
 */
export async function DELETE() {
	try {
		cacheMetrics.clear();

		return NextResponse.json(
			{ success: true, message: "Cache metrics cleared" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("[Cache Metrics API] Error clearing metrics:", error);
		return NextResponse.json(
			{ error: "Failed to clear cache metrics" },
			{ status: 500 },
		);
	}
}

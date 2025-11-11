/**
 * Cache Metrics
 * Tracks cache performance and statistics
 */

interface CacheMetrics {
	hits: number;
	misses: number;
	size: number;
	lastUpdated: Date;
}

class CacheMetricsManager {
	private metrics: Map<string, CacheMetrics> = new Map();

	recordHit(cacheKey: string) {
		const metric = this.metrics.get(cacheKey) || {
			hits: 0,
			misses: 0,
			size: 0,
			lastUpdated: new Date(),
		};

		metric.hits++;
		metric.lastUpdated = new Date();
		this.metrics.set(cacheKey, metric);
	}

	recordMiss(cacheKey: string) {
		const metric = this.metrics.get(cacheKey) || {
			hits: 0,
			misses: 0,
			size: 0,
			lastUpdated: new Date(),
		};

		metric.misses++;
		metric.lastUpdated = new Date();
		this.metrics.set(cacheKey, metric);
	}

	getMetrics(cacheKey: string): CacheMetrics | null {
		return this.metrics.get(cacheKey) || null;
	}

	getAllMetrics(): Map<string, CacheMetrics> {
		return this.metrics;
	}

	getStats() {
		const metrics = Array.from(this.metrics.entries()).map(([key, value]) => ({
			key,
			...value,
		}));

		const totalHits = metrics.reduce((sum, m) => sum + m.hits, 0);
		const totalMisses = metrics.reduce((sum, m) => sum + m.misses, 0);
		const hitRate =
			totalHits + totalMisses > 0
				? (totalHits / (totalHits + totalMisses)) * 100
				: 0;

		return {
			metrics,
			totalHits,
			totalMisses,
			hitRate,
			cacheCount: this.metrics.size,
		};
	}

	clear() {
		this.metrics.clear();
	}
}

export const cacheMetrics = new CacheMetricsManager();

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

  clear() {
    this.metrics.clear();
  }
}

export const cacheMetrics = new CacheMetricsManager();

/**
 * Cache Metrics Collection
 *
 * Tracks cache performance metrics for monitoring and debugging.
 * Provides insights into cache hit rates, invalidation frequency, and performance.
 */

export interface CacheMetric {
  timestamp: number;
  operation: 'hit' | 'miss' | 'invalidate' | 'set';
  cacheType: 'redis' | 'localStorage' | 'swr';
  key: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface CacheStats {
  totalHits: number;
  totalMisses: number;
  totalInvalidations: number;
  totalSets: number;
  hitRate: number;
  averageDuration: number;
  byType: Record<string, {
    hits: number;
    misses: number;
    invalidations: number;
    hitRate: number;
  }>;
  recentMetrics: CacheMetric[];
}

/**
 * In-memory metrics storage
 * In production, this should be replaced with a persistent store (e.g., Redis)
 */
class CacheMetricsCollector {
  private metrics: CacheMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Record a cache operation
   */
  record(metric: Omit<CacheMetric, 'timestamp'>): void {
    const fullMetric: CacheMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metrics.push(fullMetric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Record a cache hit
   */
  recordHit(cacheType: CacheMetric['cacheType'], key: string, duration?: number): void {
    this.record({ operation: 'hit', cacheType, key, duration });
  }

  /**
   * Record a cache miss
   */
  recordMiss(cacheType: CacheMetric['cacheType'], key: string, duration?: number): void {
    this.record({ operation: 'miss', cacheType, key, duration });
  }

  /**
   * Record a cache invalidation
   */
  recordInvalidation(cacheType: CacheMetric['cacheType'], key: string): void {
    this.record({ operation: 'invalidate', cacheType, key });
  }

  /**
   * Record a cache set operation
   */
  recordSet(cacheType: CacheMetric['cacheType'], key: string, duration?: number): void {
    this.record({ operation: 'set', cacheType, key, duration });
  }

  /**
   * Get aggregated cache statistics
   */
  getStats(timeWindow?: number): CacheStats {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;

    // Filter metrics by time window
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= windowStart);

    const totalHits = relevantMetrics.filter(m => m.operation === 'hit').length;
    const totalMisses = relevantMetrics.filter(m => m.operation === 'miss').length;
    const totalInvalidations = relevantMetrics.filter(m => m.operation === 'invalidate').length;
    const totalSets = relevantMetrics.filter(m => m.operation === 'set').length;

    const totalRequests = totalHits + totalMisses;
    const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

    // Calculate average duration
    const metricsWithDuration = relevantMetrics.filter(m => m.duration !== undefined);
    const averageDuration = metricsWithDuration.length > 0
      ? metricsWithDuration.reduce((sum, m) => sum + (m.duration || 0), 0) / metricsWithDuration.length
      : 0;

    // Stats by cache type
    const byType: CacheStats['byType'] = {};
    const cacheTypes: CacheMetric['cacheType'][] = ['redis', 'localStorage', 'swr'];

    cacheTypes.forEach(type => {
      const typeMetrics = relevantMetrics.filter(m => m.cacheType === type);
      const hits = typeMetrics.filter(m => m.operation === 'hit').length;
      const misses = typeMetrics.filter(m => m.operation === 'miss').length;
      const invalidations = typeMetrics.filter(m => m.operation === 'invalidate').length;
      const requests = hits + misses;

      byType[type] = {
        hits,
        misses,
        invalidations,
        hitRate: requests > 0 ? hits / requests : 0,
      };
    });

    return {
      totalHits,
      totalMisses,
      totalInvalidations,
      totalSets,
      hitRate,
      averageDuration,
      byType,
      recentMetrics: relevantMetrics.slice(-50), // Last 50 metrics
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get raw metrics
   */
  getMetrics(): CacheMetric[] {
    return [...this.metrics];
  }
}

/**
 * Singleton instance
 */
let instance: CacheMetricsCollector | null = null;

export function getCacheMetrics(): CacheMetricsCollector {
  if (!instance) {
    instance = new CacheMetricsCollector();
  }
  return instance;
}

/**
 * Convenience functions
 */
export const cacheMetrics = {
  hit: (cacheType: CacheMetric['cacheType'], key: string, duration?: number) =>
    getCacheMetrics().recordHit(cacheType, key, duration),

  miss: (cacheType: CacheMetric['cacheType'], key: string, duration?: number) =>
    getCacheMetrics().recordMiss(cacheType, key, duration),

  invalidate: (cacheType: CacheMetric['cacheType'], key: string) =>
    getCacheMetrics().recordInvalidation(cacheType, key),

  set: (cacheType: CacheMetric['cacheType'], key: string, duration?: number) =>
    getCacheMetrics().recordSet(cacheType, key, duration),

  getStats: (timeWindow?: number) =>
    getCacheMetrics().getStats(timeWindow),

  clear: () =>
    getCacheMetrics().clear(),
};

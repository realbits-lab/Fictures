/**
 * Cache Monitoring and Alerts
 *
 * Production monitoring system for cache performance.
 * Triggers alerts when metrics fall below acceptable thresholds.
 *
 * Usage:
 *   import { cacheMonitor } from '@/lib/monitoring/cache-alerts';
 *
 *   // Check health
 *   const health = await cacheMonitor.checkHealth();
 *
 *   // Get alerts
 *   const alerts = cacheMonitor.getActiveAlerts();
 */

import { cacheMetrics } from '../cache/cache-metrics';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Alert types
 */
export type AlertType =
  | 'low_hit_rate'
  | 'high_error_rate'
  | 'slow_response'
  | 'high_invalidation_rate'
  | 'cache_unavailable';

/**
 * Alert definition
 */
export interface CacheAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  metric: string;
  threshold: number;
  currentValue: number;
  timestamp: number;
  acknowledged: boolean;
}

/**
 * Monitoring thresholds
 */
export const MONITORING_THRESHOLDS = {
  // Hit rate thresholds
  HIT_RATE_WARNING: 0.7, // Warn if hit rate < 70%
  HIT_RATE_CRITICAL: 0.5, // Critical if hit rate < 50%

  // Response time thresholds (ms)
  RESPONSE_TIME_WARNING: 200, // Warn if avg response > 200ms
  RESPONSE_TIME_CRITICAL: 500, // Critical if avg response > 500ms

  // Error rate thresholds
  ERROR_RATE_WARNING: 0.01, // Warn if error rate > 1%
  ERROR_RATE_CRITICAL: 0.05, // Critical if error rate > 5%

  // Invalidation rate thresholds (invalidations per request)
  INVALIDATION_RATE_WARNING: 0.3, // Warn if invalidations > 30% of requests
  INVALIDATION_RATE_CRITICAL: 0.5, // Critical if invalidations > 50% of requests
};

/**
 * Cache Monitor class
 */
class CacheMonitor {
  private alerts: Map<string, CacheAlert> = new Map();
  private lastCheck: number = 0;
  private checkInterval: number = 60000; // Check every 60 seconds

  /**
   * Check cache health and generate alerts
   */
  public async checkHealth(): Promise<{
    healthy: boolean;
    alerts: CacheAlert[];
    stats: ReturnType<typeof cacheMetrics.getStats>;
  }> {
    const now = Date.now();

    // Skip if checked recently
    if (now - this.lastCheck < this.checkInterval) {
      return {
        healthy: this.alerts.size === 0,
        alerts: Array.from(this.alerts.values()),
        stats: cacheMetrics.getStats(),
      };
    }

    this.lastCheck = now;

    // Get current stats
    const stats = cacheMetrics.getStats();

    // Clear previous alerts (will regenerate active ones)
    this.alerts.clear();

    // Check hit rate
    this.checkHitRate(stats.hitRate);

    // Check response time
    this.checkResponseTime(stats.averageDuration);

    // Check error rate (if we had error tracking)
    // For now, we'll estimate from failed operations
    const errorRate = this.estimateErrorRate(stats);
    this.checkErrorRate(errorRate);

    // Check invalidation rate
    const invalidationRate = this.calculateInvalidationRate(stats);
    this.checkInvalidationRate(invalidationRate);

    // Check cache availability by type
    Object.entries(stats.byType).forEach(([type, typeStats]) => {
      this.checkCacheTypeHealth(type, typeStats);
    });

    const healthy = !Array.from(this.alerts.values()).some(
      (alert) => alert.severity === 'critical' || alert.severity === 'error'
    );

    return {
      healthy,
      alerts: Array.from(this.alerts.values()),
      stats,
    };
  }

  /**
   * Check hit rate threshold
   */
  private checkHitRate(hitRate: number): void {
    if (hitRate < MONITORING_THRESHOLDS.HIT_RATE_CRITICAL) {
      this.createAlert({
        type: 'low_hit_rate',
        severity: 'critical',
        message: `Cache hit rate critically low: ${(hitRate * 100).toFixed(1)}%`,
        metric: 'hit_rate',
        threshold: MONITORING_THRESHOLDS.HIT_RATE_CRITICAL,
        currentValue: hitRate,
      });
    } else if (hitRate < MONITORING_THRESHOLDS.HIT_RATE_WARNING) {
      this.createAlert({
        type: 'low_hit_rate',
        severity: 'warning',
        message: `Cache hit rate below optimal: ${(hitRate * 100).toFixed(1)}%`,
        metric: 'hit_rate',
        threshold: MONITORING_THRESHOLDS.HIT_RATE_WARNING,
        currentValue: hitRate,
      });
    }
  }

  /**
   * Check response time threshold
   */
  private checkResponseTime(avgDuration: number): void {
    if (avgDuration > MONITORING_THRESHOLDS.RESPONSE_TIME_CRITICAL) {
      this.createAlert({
        type: 'slow_response',
        severity: 'critical',
        message: `Average response time critically high: ${avgDuration.toFixed(1)}ms`,
        metric: 'response_time',
        threshold: MONITORING_THRESHOLDS.RESPONSE_TIME_CRITICAL,
        currentValue: avgDuration,
      });
    } else if (avgDuration > MONITORING_THRESHOLDS.RESPONSE_TIME_WARNING) {
      this.createAlert({
        type: 'slow_response',
        severity: 'warning',
        message: `Average response time above optimal: ${avgDuration.toFixed(1)}ms`,
        metric: 'response_time',
        threshold: MONITORING_THRESHOLDS.RESPONSE_TIME_WARNING,
        currentValue: avgDuration,
      });
    }
  }

  /**
   * Check error rate threshold
   */
  private checkErrorRate(errorRate: number): void {
    if (errorRate > MONITORING_THRESHOLDS.ERROR_RATE_CRITICAL) {
      this.createAlert({
        type: 'high_error_rate',
        severity: 'critical',
        message: `Error rate critically high: ${(errorRate * 100).toFixed(2)}%`,
        metric: 'error_rate',
        threshold: MONITORING_THRESHOLDS.ERROR_RATE_CRITICAL,
        currentValue: errorRate,
      });
    } else if (errorRate > MONITORING_THRESHOLDS.ERROR_RATE_WARNING) {
      this.createAlert({
        type: 'high_error_rate',
        severity: 'warning',
        message: `Error rate above normal: ${(errorRate * 100).toFixed(2)}%`,
        metric: 'error_rate',
        threshold: MONITORING_THRESHOLDS.ERROR_RATE_WARNING,
        currentValue: errorRate,
      });
    }
  }

  /**
   * Check invalidation rate threshold
   */
  private checkInvalidationRate(invalidationRate: number): void {
    if (invalidationRate > MONITORING_THRESHOLDS.INVALIDATION_RATE_CRITICAL) {
      this.createAlert({
        type: 'high_invalidation_rate',
        severity: 'error',
        message: `Cache invalidation rate very high: ${(invalidationRate * 100).toFixed(1)}%`,
        metric: 'invalidation_rate',
        threshold: MONITORING_THRESHOLDS.INVALIDATION_RATE_CRITICAL,
        currentValue: invalidationRate,
      });
    } else if (invalidationRate > MONITORING_THRESHOLDS.INVALIDATION_RATE_WARNING) {
      this.createAlert({
        type: 'high_invalidation_rate',
        severity: 'warning',
        message: `Cache invalidation rate high: ${(invalidationRate * 100).toFixed(1)}%`,
        metric: 'invalidation_rate',
        threshold: MONITORING_THRESHOLDS.INVALIDATION_RATE_WARNING,
        currentValue: invalidationRate,
      });
    }
  }

  /**
   * Check cache type health
   */
  private checkCacheTypeHealth(
    type: string,
    stats: { hits: number; misses: number; invalidations: number; hitRate: number }
  ): void {
    if (stats.hits + stats.misses === 0) {
      this.createAlert({
        type: 'cache_unavailable',
        severity: 'error',
        message: `${type} cache appears unavailable (no activity)`,
        metric: `${type}_availability`,
        threshold: 1,
        currentValue: 0,
      });
    }

    if (stats.hitRate < 0.3 && stats.hits + stats.misses > 10) {
      this.createAlert({
        type: 'low_hit_rate',
        severity: 'warning',
        message: `${type} cache has very low hit rate: ${(stats.hitRate * 100).toFixed(1)}%`,
        metric: `${type}_hit_rate`,
        threshold: 0.3,
        currentValue: stats.hitRate,
      });
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(config: {
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    metric: string;
    threshold: number;
    currentValue: number;
  }): void {
    const id = `${config.type}_${config.metric}_${Date.now()}`;

    const alert: CacheAlert = {
      id,
      type: config.type,
      severity: config.severity,
      message: config.message,
      metric: config.metric,
      threshold: config.threshold,
      currentValue: config.currentValue,
      timestamp: Date.now(),
      acknowledged: false,
    };

    this.alerts.set(id, alert);
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): CacheAlert[] {
    return Array.from(this.alerts.values()).filter((alert) => !alert.acknowledged);
  }

  /**
   * Get alerts by severity
   */
  public getAlertsBySeverity(severity: AlertSeverity): CacheAlert[] {
    return Array.from(this.alerts.values()).filter((alert) => alert.severity === severity);
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Clear all alerts
   */
  public clearAllAlerts(): void {
    this.alerts.clear();
  }

  /**
   * Estimate error rate from metrics
   */
  private estimateErrorRate(stats: ReturnType<typeof cacheMetrics.getStats>): number {
    // For now, estimate from low hit rate as proxy
    // In production, track actual errors
    const totalOps = stats.totalHits + stats.totalMisses;
    if (totalOps === 0) return 0;

    // If hit rate is very low, it may indicate errors
    if (stats.hitRate < 0.2) {
      return 0.1; // Estimate 10% error rate
    }

    return 0; // No error tracking yet
  }

  /**
   * Calculate invalidation rate
   */
  private calculateInvalidationRate(stats: ReturnType<typeof cacheMetrics.getStats>): number {
    const totalOps = stats.totalHits + stats.totalMisses;
    if (totalOps === 0) return 0;

    const totalInvalidations = Object.values(stats.byType).reduce(
      (sum, typeStats) => sum + typeStats.invalidations,
      0
    );

    return totalInvalidations / totalOps;
  }
}

// Export singleton instance
export const cacheMonitor = new CacheMonitor();

/**
 * Production monitoring hook
 * Runs periodic health checks
 */
export async function startCacheMonitoring(intervalMs: number = 60000): Promise<void> {
  console.log('[Cache Monitor] Starting production monitoring...');

  // Run initial check
  const initialHealth = await cacheMonitor.checkHealth();
  console.log(
    `[Cache Monitor] Initial health check: ${initialHealth.healthy ? '✅ Healthy' : '⚠️ Issues detected'}`
  );

  if (!initialHealth.healthy) {
    console.warn(`[Cache Monitor] Active alerts: ${initialHealth.alerts.length}`);
    initialHealth.alerts.forEach((alert) => {
      console.warn(`  - [${alert.severity.toUpperCase()}] ${alert.message}`);
    });
  }

  // Schedule periodic checks
  setInterval(async () => {
    const health = await cacheMonitor.checkHealth();

    if (!health.healthy) {
      console.warn(`[Cache Monitor] Health check failed - Active alerts: ${health.alerts.length}`);

      // Log critical alerts
      const criticalAlerts = health.alerts.filter((a) => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        console.error(`[Cache Monitor] 🚨 CRITICAL ALERTS: ${criticalAlerts.length}`);
        criticalAlerts.forEach((alert) => {
          console.error(`  - ${alert.message}`);
        });
      }
    }
  }, intervalMs);

  console.log(`[Cache Monitor] Monitoring started (checking every ${intervalMs / 1000}s)`);
}

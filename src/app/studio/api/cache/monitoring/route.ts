/**
 * Cache Monitoring API
 *
 * Provides real-time cache health monitoring and alerts.
 * Used by monitoring dashboards and alert systems.
 *
 * GET /studio/api/cache/monitoring - Get current health status
 * POST /studio/api/cache/monitoring/acknowledge - Acknowledge alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { cacheMonitor } from '@/lib/monitoring/cache-alerts';

/**
 * GET /studio/api/cache/monitoring
 *
 * Returns current cache health status and active alerts.
 */
export async function GET() {
  try {
    const health = await cacheMonitor.checkHealth();

    const response = {
      healthy: health.healthy,
      timestamp: new Date().toISOString(),
      summary: {
        hitRate: health.stats.hitRate,
        averageDuration: health.stats.averageDuration,
        totalHits: health.stats.totalHits,
        totalMisses: health.stats.totalMisses,
      },
      alerts: {
        total: health.alerts.length,
        critical: health.alerts.filter((a) => a.severity === 'critical').length,
        error: health.alerts.filter((a) => a.severity === 'error').length,
        warning: health.alerts.filter((a) => a.severity === 'warning').length,
        list: health.alerts,
      },
      byType: health.stats.byType,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Cache Monitoring API] Error:', error);
    return NextResponse.json(
      {
        healthy: false,
        error: 'Failed to check cache health',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /studio/api/cache/monitoring/acknowledge
 *
 * Acknowledges a specific alert.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json({ error: 'alertId is required' }, { status: 400 });
    }

    const acknowledged = cacheMonitor.acknowledgeAlert(alertId);

    if (!acknowledged) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      alertId,
      acknowledgedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cache Monitoring API] Error acknowledging alert:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    );
  }
}

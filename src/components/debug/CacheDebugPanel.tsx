'use client';

/**
 * Cache Debug Panel
 *
 * Visual debugging tool for cache performance.
 * Shows real-time cache metrics, hit rates, and recent operations.
 *
 * Usage:
 *   <CacheDebugPanel />
 *
 * Note: Only render in development or for admin users
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { cacheMetrics } from '@/lib/cache/cache-metrics';
import { useCacheInvalidation } from '@/lib/hooks/use-cache-invalidation';

export function CacheDebugPanel() {
  const [stats, setStats] = useState(() => cacheMetrics.getStats());
  const [isVisible, setIsVisible] = useState(false);
  const { clearAllCaches } = useCacheInvalidation();

  // Update stats every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cacheMetrics.getStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: Ctrl+Shift+D to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg hover:bg-gray-700"
        title="Show Cache Debug Panel (Ctrl+Shift+D)"
      >
        Cache Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] overflow-auto bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Cache Debug Panel</CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => {
                cacheMetrics.clear();
                setStats(cacheMetrics.getStats());
              }}
              className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Clear Metrics
            </button>
            <button
              onClick={() => {
                clearAllCaches();
                alert('All caches cleared!');
              }}
              className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Caches
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
          {/* Overall Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <div className="text-gray-500 dark:text-gray-400">Hit Rate</div>
              <div className="text-lg font-bold text-green-600">
                {(stats.hitRate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <div className="text-gray-500 dark:text-gray-400">Avg Duration</div>
              <div className="text-lg font-bold text-blue-600">
                {stats.averageDuration.toFixed(1)}ms
              </div>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <div className="text-gray-500 dark:text-gray-400">Total Hits</div>
              <div className="text-lg font-bold">{stats.totalHits}</div>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <div className="text-gray-500 dark:text-gray-400">Total Misses</div>
              <div className="text-lg font-bold">{stats.totalMisses}</div>
            </div>
          </div>

          {/* By Cache Type */}
          <div>
            <h3 className="font-semibold mb-2">By Cache Type</h3>
            <div className="space-y-2">
              {Object.entries(stats.byType).map(([type, typeStats]) => (
                <div key={type} className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium capitalize">{type}</span>
                    <span className="text-green-600 font-bold">
                      {(typeStats.hitRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Hits: {typeStats.hits} | Misses: {typeStats.misses} | Invalidations: {typeStats.invalidations}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Operations */}
          <div>
            <h3 className="font-semibold mb-2">Recent Operations</h3>
            <div className="space-y-1 max-h-40 overflow-auto">
              {stats.recentMetrics.slice(-10).reverse().map((metric, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-xs ${
                    metric.operation === 'hit' ? 'bg-green-50 dark:bg-green-900/20' :
                    metric.operation === 'miss' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                    metric.operation === 'invalidate' ? 'bg-red-50 dark:bg-red-900/20' :
                    'bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono">
                      <span className={`inline-block px-1 rounded mr-1 ${
                        metric.operation === 'hit' ? 'bg-green-200 dark:bg-green-800' :
                        metric.operation === 'miss' ? 'bg-yellow-200 dark:bg-yellow-800' :
                        metric.operation === 'invalidate' ? 'bg-red-200 dark:bg-red-800' :
                        'bg-blue-200 dark:bg-blue-800'
                      }`}>
                        {metric.operation.toUpperCase()}
                      </span>
                      {metric.cacheType}
                    </span>
                    {metric.duration && (
                      <span className="text-gray-500">{metric.duration.toFixed(0)}ms</span>
                    )}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 truncate mt-1">
                    {metric.key}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
            <div>Press <kbd className="px-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Shift+D</kbd> to toggle</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";
import { useCacheManagement } from "@/lib/hooks/use-page-cache";
import { CACHE_CONFIGS } from "@/lib/hooks/use-persisted-swr";

interface CacheStats {
  totalSize: number;
  totalEntries: number;
  byPage?: Record<string, { size: number; entries: number; lastUpdated?: string }>;
}

export function CacheManagerWidget() {
  const { clearAllCache, getCacheStats, clearPageCache, invalidatePageCache } = useCacheManagement();
  const [cacheStats, setCacheStats] = useState<CacheStats>({ totalSize: 0, totalEntries: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const refreshStats = useCallback(() => {
    setCacheStats(getCacheStats());
  }, [getCacheStats]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all cached data? This will refresh the page.')) {
      setIsLoading(true);
      clearAllCache();
    }
  };

  const handleClearPage = (pageType: string) => {
    if (window.confirm(`Clear all ${pageType} page cache data?`)) {
      clearPageCache(pageType);
      refreshStats();
    }
  };

  const handleInvalidatePage = (pageType: string) => {
    invalidatePageCache(pageType);
    refreshStats();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPageTypeIcon = (pageType: string) => {
    switch (pageType) {
      case 'writing': return '✍️';
      case 'reading': return '📖';
      case 'community': return '💬';
      case 'publish': return '📤';
      case 'analytics': return '📊';
      case 'settings': return '⚙️';
      default: return '📄';
    }
  };

  const getCacheHealth = (pageType: string) => {
    const config = CACHE_CONFIGS[pageType as keyof typeof CACHE_CONFIGS];
    const pageStats = cacheStats.byPage?.[pageType];
    
    if (!pageStats || !config) return 'unknown';
    
    const age = pageStats.lastUpdated ? 
      Date.now() - new Date(pageStats.lastUpdated).getTime() : 
      Infinity;
    
    if (age < config.ttl * 0.5) return 'fresh';
    if (age < config.ttl) return 'stale';
    return 'expired';
  };

  const getHealthBadgeVariant = (health: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (health) {
      case 'fresh': return 'default';
      case 'stale': return 'secondary';
      case 'expired': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🗄️</span>
            Cache Management
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshStats}
              disabled={isLoading}
            >
              🔄 Refresh
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleClearAll}
              disabled={isLoading}
            >
              🧹 Clear All
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {cacheStats.totalEntries}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Entries
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatBytes(cacheStats.totalSize)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Cache Size
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(CACHE_CONFIGS).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page Types
            </div>
          </div>
        </div>

        {/* Per-Page Cache Management */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Page Cache Status
          </h3>
          <div className="space-y-3">
            {Object.entries(CACHE_CONFIGS).map(([pageType, config]) => {
              const pageStats = cacheStats.byPage?.[pageType];
              const health = getCacheHealth(pageType);
              const ttlMinutes = Math.round(config.ttl / (1000 * 60));
              
              return (
                <div 
                  key={pageType}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getPageTypeIcon(pageType)}</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {pageType} Page
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        TTL: {ttlMinutes}min • {pageStats?.entries || 0} entries • {formatBytes(pageStats?.size || 0)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getHealthBadgeVariant(health)}>
                      {health}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleInvalidatePage(pageType)}
                      title="Mark as stale (will refresh on next access)"
                    >
                      ⚡ Invalidate
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleClearPage(pageType)}
                      title="Clear all cache data for this page type"
                    >
                      🗑️ Clear
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cache Configuration Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Cache Strategy
          </h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p>• <strong>Writing:</strong> 30min TTL (personal stories change infrequently)</p>
            <p>• <strong>Reading:</strong> 10min TTL (public content updates regularly)</p>
            <p>• <strong>Community:</strong> 5min TTL (active discussions change frequently)</p>
            <p>• <strong>Analytics:</strong> 2min TTL (metrics update frequently)</p>
            <p>• <strong>Publish:</strong> 1hr TTL (publishing schedules change moderately)</p>
            <p>• <strong>Settings:</strong> 24hr TTL (preferences rarely change)</p>
          </div>
        </div>

        {/* Cache Health Tips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 font-medium text-green-800 dark:text-green-200 mb-1">
              <Badge variant="default">Fresh</Badge>
              Recently cached
            </div>
            <div className="text-green-700 dark:text-green-300">
              Data is current and performant
            </div>
          </div>
          
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center gap-2 font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              <Badge variant="destructive">Stale</Badge>
              Aging cache
            </div>
            <div className="text-yellow-700 dark:text-yellow-300">
              Still valid but will refresh soon
            </div>
          </div>
          
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center gap-2 font-medium text-red-800 dark:text-red-200 mb-1">
              <Badge variant="danger">Expired</Badge>
              Needs refresh
            </div>
            <div className="text-red-700 dark:text-red-300">
              Will be refreshed on next access
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
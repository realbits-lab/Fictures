'use client';

import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import { useState, useEffect } from 'react';

// Cache configuration interface
interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  version?: string; // Cache version for invalidation
  maxSize?: number; // Max storage size in bytes
  compress?: boolean; // Enable data compression
}

// Default cache settings for different page types
export const CACHE_CONFIGS = {
  writing: { ttl: 30 * 60 * 1000, version: '1.0.0' }, // 30min
  reading: { ttl: 60 * 60 * 1000, version: '1.1.0', compress: true }, // 1hr (optimized for published stories - they don't change often)
  community: { ttl: 5 * 60 * 1000, version: '1.0.0' }, // 5min
  publish: { ttl: 60 * 60 * 1000, version: '1.0.0' }, // 1hr
  analytics: { ttl: 2 * 60 * 1000, version: '1.0.0' }, // 2min
  settings: { ttl: 24 * 60 * 60 * 1000, version: '1.0.0' }, // 24hr
} as const;

// Cache utilities
class CacheManager {
  private static instance: CacheManager;
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Check if we're in browser environment
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Generate cache key
  private getCacheKey(key: string, suffix: string = ''): string {
    return `swr-cache-${key}${suffix ? `-${suffix}` : ''}`;
  }

  // Get cached data with TTL validation
  getCachedData<T>(key: string, config: CacheConfig): T | undefined {
    if (!this.isBrowser()) return undefined;

    try {
      const dataKey = this.getCacheKey(key);
      const timestampKey = this.getCacheKey(key, 'timestamp');
      const versionKey = this.getCacheKey(key, 'version');

      const data = localStorage.getItem(dataKey);
      const timestamp = localStorage.getItem(timestampKey);
      const version = localStorage.getItem(versionKey);

      // Check version compatibility
      if (config.version && version !== config.version) {
        this.clearCachedData(key);
        return undefined;
      }

      // Check TTL
      if (data && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (!config.ttl || age < config.ttl) {
          return JSON.parse(data);
        }
      }

      // Clear expired data
      this.clearCachedData(key);
    } catch (error) {
      console.warn(`Failed to read cache for key: ${key}`, error);
      this.clearCachedData(key);
    }

    return undefined;
  }

  // Set cached data with metadata
  setCachedData<T>(key: string, data: T, config: CacheConfig): void {
    if (!this.isBrowser()) return;

    try {
      const dataKey = this.getCacheKey(key);
      const timestampKey = this.getCacheKey(key, 'timestamp');
      const versionKey = this.getCacheKey(key, 'version');

      // Store data with metadata
      localStorage.setItem(dataKey, JSON.stringify(data));
      localStorage.setItem(timestampKey, Date.now().toString());
      
      if (config.version) {
        localStorage.setItem(versionKey, config.version);
      }

      // Trigger cache cleanup if needed
      this.cleanupCache();
    } catch (error) {
      console.warn(`Failed to cache data for key: ${key}`, error);
    }
  }

  // Clear specific cached data
  clearCachedData(key: string): void {
    if (!this.isBrowser()) return;

    try {
      const dataKey = this.getCacheKey(key);
      const timestampKey = this.getCacheKey(key, 'timestamp');
      const versionKey = this.getCacheKey(key, 'version');

      localStorage.removeItem(dataKey);
      localStorage.removeItem(timestampKey);
      localStorage.removeItem(versionKey);
    } catch (error) {
      console.warn(`Failed to clear cache for key: ${key}`, error);
    }
  }

  // Get detailed cache statistics
  getCacheStats(): { 
    totalSize: number; 
    totalEntries: number; 
    byPage: Record<string, { size: number; entries: number; lastUpdated?: string }>;
  } {
    if (!this.isBrowser()) return { 
      totalSize: 0, 
      totalEntries: 0, 
      byPage: {} 
    };

    let totalSize = 0;
    let totalEntries = 0;
    const byPage: Record<string, { size: number; entries: number; lastUpdated?: string }> = {};

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('swr-cache-') && !key.includes('-timestamp') && !key.includes('-version')) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
            totalEntries++;

            // Extract page type from cache key
            const cacheKey = key.replace('swr-cache-', '');
            const pageType = this.extractPageTypeFromKey(cacheKey);
            
            if (pageType) {
              if (!byPage[pageType]) {
                byPage[pageType] = { size: 0, entries: 0 };
              }
              byPage[pageType].size += value.length;
              byPage[pageType].entries++;

              // Get last updated timestamp
              const timestampKey = key + '-timestamp';
              const timestamp = localStorage.getItem(timestampKey);
              if (timestamp) {
                const date = new Date(parseInt(timestamp)).toISOString();
                if (!byPage[pageType].lastUpdated || date > byPage[pageType].lastUpdated!) {
                  byPage[pageType].lastUpdated = date;
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to calculate cache stats', error);
    }

    return { totalSize, totalEntries, byPage };
  }

  // Extract page type from cache key
  private extractPageTypeFromKey(cacheKey: string): string | null {
    // Try to match patterns like /api/stories/user (writing), /api/stories/published (reading), etc.
    if (cacheKey.includes('stories/user') || cacheKey.includes('stories/drafts')) return 'writing';
    if (cacheKey.includes('stories/published') || cacheKey.includes('stories/featured')) return 'reading';
    if (cacheKey.includes('community')) return 'community';
    if (cacheKey.includes('publish')) return 'publish';
    if (cacheKey.includes('analytics')) return 'analytics';
    if (cacheKey.includes('settings')) return 'settings';
    return null;
  }

  // Clear cache for a specific page type
  clearPageCache(pageType: string): void {
    if (!this.isBrowser()) return;

    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('swr-cache-')) {
          const cacheKey = key.replace('swr-cache-', '').split('-')[0]; // Remove suffixes
          const extractedPageType = this.extractPageTypeFromKey(cacheKey);
          
          if (extractedPageType === pageType) {
            keysToRemove.push(key);
            // Also remove associated timestamp and version keys
            keysToRemove.push(key + '-timestamp');
            keysToRemove.push(key + '-version');
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`Cleared ${pageType} page cache: ${keysToRemove.length / 3} entries removed`);
    } catch (error) {
      console.warn(`Failed to clear ${pageType} page cache`, error);
    }
  }

  // Invalidate cache for a specific page type (mark as stale)
  invalidatePageCache(pageType: string): void {
    if (!this.isBrowser()) return;

    try {
      let invalidated = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('swr-cache-') && !key.includes('-timestamp') && !key.includes('-version')) {
          const cacheKey = key.replace('swr-cache-', '');
          const extractedPageType = this.extractPageTypeFromKey(cacheKey);
          
          if (extractedPageType === pageType) {
            // Set timestamp to 0 to make it immediately stale
            const timestampKey = key + '-timestamp';
            localStorage.setItem(timestampKey, '0');
            invalidated++;
          }
        }
      }

      console.log(`Invalidated ${pageType} page cache: ${invalidated} entries marked as stale`);
    } catch (error) {
      console.warn(`Failed to invalidate ${pageType} page cache`, error);
    }
  }

  // Get cache health status for a page type
  getCacheHealth(pageType: string): 'fresh' | 'stale' | 'expired' | 'unknown' {
    if (!this.isBrowser()) return 'unknown';

    try {
      const { byPage } = this.getCacheStats();
      const pageStats = byPage[pageType];
      
      if (!pageStats || !pageStats.lastUpdated) return 'unknown';
      
      const age = Date.now() - new Date(pageStats.lastUpdated).getTime();
      
      // Get TTL for this page type
      const ttl = this.getPageTypeTTL(pageType);
      if (!ttl) return 'unknown';
      
      if (age < ttl * 0.5) return 'fresh';
      if (age < ttl) return 'stale';
      return 'expired';
    } catch (error) {
      console.warn(`Failed to get cache health for ${pageType}`, error);
      return 'unknown';
    }
  }

  // Get TTL for a page type
  private getPageTypeTTL(pageType: string): number | null {
    const configs = {
      writing: 30 * 60 * 1000, // 30min
      reading: 10 * 60 * 1000, // 10min  
      community: 5 * 60 * 1000, // 5min
      publish: 60 * 60 * 1000, // 1hr
      analytics: 2 * 60 * 1000, // 2min
      settings: 24 * 60 * 60 * 1000, // 24hr
    };
    
    return configs[pageType as keyof typeof configs] || null;
  }

  // Preload cache for a specific page type (placeholder for future implementation)
  preloadPageCache(pageType: string): void {
    console.log(`Preloading ${pageType} page cache - feature not yet implemented`);
    // This could trigger prefetch of common data for the page type
    // For now, it's a placeholder that could be implemented with specific API calls
  }

  // Cleanup old cache entries
  private cleanupCache(): void {
    const MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB limit
    const stats = this.getCacheStats();

    if (stats.totalSize > MAX_CACHE_SIZE) {
      this.pruneOldestEntries(stats.totalSize - MAX_CACHE_SIZE);
    }
  }

  // Remove oldest cache entries
  private pruneOldestEntries(bytesToRemove: number): void {
    if (!this.isBrowser()) return;

    try {
      const entries: Array<{
        key: string;
        size: number;
        timestamp: number;
      }> = [];

      // Collect all cache entries with their timestamps
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('swr-cache-') && !key.includes('-timestamp') && !key.includes('-version')) {
          const value = localStorage.getItem(key);
          const timestampKey = key + '-timestamp';
          const timestamp = localStorage.getItem(timestampKey);
          
          if (value && timestamp) {
            entries.push({
              key: key.replace('swr-cache-', ''),
              size: value.length,
              timestamp: parseInt(timestamp)
            });
          }
        }
      }

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest entries until we've freed enough space
      let removedBytes = 0;
      for (const entry of entries) {
        if (removedBytes >= bytesToRemove) break;
        
        this.clearCachedData(entry.key);
        removedBytes += entry.size;
      }

      console.log(`Cache cleanup: removed ${removedBytes} bytes in ${Math.ceil(removedBytes / 1024)}KB`);
    } catch (error) {
      console.warn('Failed to prune cache', error);
    }
  }

  // Clear all cache data
  clearAllCache(): void {
    if (!this.isBrowser()) return;

    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('swr-cache-')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`Cleared all SWR cache: ${keysToRemove.length} entries removed`);
    } catch (error) {
      console.warn('Failed to clear all cache', error);
    }
  }
}

// Main hook for persisted SWR
export function usePersistedSWR<Data = any, Error = any>(
  key: string | null,
  fetcher: ((key: string) => Data | Promise<Data>) | null,
  cacheConfig: CacheConfig,
  swrConfig?: SWRConfiguration<Data, Error>
): SWRResponse<Data, Error> {
  const cache = CacheManager.getInstance();

  // Get initial data from localStorage only on client side to prevent hydration mismatch
  const [fallbackData, setFallbackData] = useState<Data | undefined>(undefined);
  const [hasSetFallback, setHasSetFallback] = useState(false);

  // Use useEffect to set fallback data after hydration (only once)
  useEffect(() => {
    if (!hasSetFallback && key) {
      const cachedData = cache.getCachedData<Data>(key, cacheConfig);
      if (cachedData) {
        setFallbackData(cachedData);
      }
      setHasSetFallback(true);
    }
  }, [key, hasSetFallback, cache, cacheConfig]);

  const swr = useSWR<Data, Error>(
    key,
    fetcher,
    {
      ...swrConfig,
      fallbackData,
      onSuccess: (data, key) => {
        // Save successful responses to localStorage
        if (key) cache.setCachedData(key, data, cacheConfig);
        swrConfig?.onSuccess?.(data, key, swrConfig as any);
      },
      onError: (error, key) => {
        console.warn(`SWR error for key ${key}:`, error);
        swrConfig?.onError?.(error, key, swrConfig as any);
      }
    }
  );

  return swr;
}

// Export cache manager instance
export const cacheManager = CacheManager.getInstance();
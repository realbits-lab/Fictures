import { Redis } from '@upstash/redis';
import { OptimizedHierarchy } from '@/lib/db/queries/hierarchy-performance';

// Redis client setup (using Upstash Redis for Vercel compatibility)
const redis = new Redis({
  url: process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache key generators
const CACHE_KEYS = {
  hierarchy: (bookId: string) => `hierarchy:${bookId}`,
  breadcrumb: (sceneId: string) => `breadcrumb:${sceneId}`,
  wordCount: (bookId: string) => `word-count:${bookId}`,
  search: (bookId: string, query: string) => `search:${bookId}:${Buffer.from(query).toString('base64')}`,
  aiContext: (sceneId: string) => `ai-context:scene:${sceneId}`,
  userPermissions: (userId: string, bookId: string) => `permissions:${userId}:${bookId}`,
  hierarchyMetadata: (bookId: string) => `metadata:${bookId}`,
} as const;

// Cache TTL settings (in seconds)
const CACHE_TTL = {
  hierarchy: 3600, // 1 hour
  breadcrumb: 1800, // 30 minutes  
  wordCount: 900, // 15 minutes
  search: 600, // 10 minutes
  aiContext: 1800, // 30 minutes
  userPermissions: 3600, // 1 hour
  metadata: 7200, // 2 hours
} as const;

/**
 * Hierarchy cache management with Redis
 */
export class HierarchyCacheManager {
  // Cache hierarchy data with automatic TTL
  static async setHierarchy(bookId: string, hierarchy: OptimizedHierarchy): Promise<void> {
    try {
      await redis.setex(
        CACHE_KEYS.hierarchy(bookId),
        CACHE_TTL.hierarchy,
        JSON.stringify(hierarchy)
      );
    } catch (error) {
      console.error('Failed to cache hierarchy:', error);
      // Fail silently - cache should not break the application
    }
  }

  // Get cached hierarchy data
  static async getHierarchy(bookId: string): Promise<OptimizedHierarchy | null> {
    try {
      const cached = await redis.get(CACHE_KEYS.hierarchy(bookId));
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.error('Failed to get cached hierarchy:', error);
      return null;
    }
  }

  // Cache breadcrumb data
  static async setBreadcrumb(sceneId: string, breadcrumb: any): Promise<void> {
    try {
      await redis.setex(
        CACHE_KEYS.breadcrumb(sceneId),
        CACHE_TTL.breadcrumb,
        JSON.stringify(breadcrumb)
      );
    } catch (error) {
      console.error('Failed to cache breadcrumb:', error);
    }
  }

  // Get cached breadcrumb data
  static async getBreadcrumb(sceneId: string): Promise<any | null> {
    try {
      const cached = await redis.get(CACHE_KEYS.breadcrumb(sceneId));
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.error('Failed to get cached breadcrumb:', error);
      return null;
    }
  }

  // Cache word count with high-frequency updates
  static async setWordCount(bookId: string, wordCount: number): Promise<void> {
    try {
      await redis.setex(
        CACHE_KEYS.wordCount(bookId),
        CACHE_TTL.wordCount,
        wordCount.toString()
      );
    } catch (error) {
      console.error('Failed to cache word count:', error);
    }
  }

  // Get cached word count
  static async getWordCount(bookId: string): Promise<number | null> {
    try {
      const cached = await redis.get(CACHE_KEYS.wordCount(bookId));
      return cached ? parseInt(cached as string, 10) : null;
    } catch (error) {
      console.error('Failed to get cached word count:', error);
      return null;
    }
  }

  // Cache search results
  static async setSearchResults(bookId: string, query: string, results: any[]): Promise<void> {
    try {
      await redis.setex(
        CACHE_KEYS.search(bookId, query),
        CACHE_TTL.search,
        JSON.stringify(results)
      );
    } catch (error) {
      console.error('Failed to cache search results:', error);
    }
  }

  // Get cached search results
  static async getSearchResults(bookId: string, query: string): Promise<any[] | null> {
    try {
      const cached = await redis.get(CACHE_KEYS.search(bookId, query));
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.error('Failed to get cached search results:', error);
      return null;
    }
  }

  // Cache AI context for scenes
  static async setAIContext(sceneId: string, context: any): Promise<void> {
    try {
      await redis.setex(
        CACHE_KEYS.aiContext(sceneId),
        CACHE_TTL.aiContext,
        JSON.stringify(context)
      );
    } catch (error) {
      console.error('Failed to cache AI context:', error);
    }
  }

  // Get cached AI context
  static async getAIContext(sceneId: string): Promise<any | null> {
    try {
      const cached = await redis.get(CACHE_KEYS.aiContext(sceneId));
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.error('Failed to get cached AI context:', error);
      return null;
    }
  }

  // Invalidate related caches when hierarchy changes
  static async invalidateHierarchyCache(bookId: string): Promise<void> {
    try {
      const keysToDelete = [
        CACHE_KEYS.hierarchy(bookId),
        CACHE_KEYS.wordCount(bookId),
        CACHE_KEYS.hierarchyMetadata(bookId),
      ];

      // Also invalidate all search results for this book
      const searchPattern = CACHE_KEYS.search(bookId, '*').replace('*', '');
      const searchKeys = await redis.keys(`${searchPattern}*`);
      
      const allKeysToDelete = [...keysToDelete, ...searchKeys];
      
      if (allKeysToDelete.length > 0) {
        await redis.del(...allKeysToDelete);
      }
    } catch (error) {
      console.error('Failed to invalidate hierarchy cache:', error);
    }
  }

  // Invalidate breadcrumb caches for a chapter
  static async invalidateBreadcrumbCache(chapterId: string): Promise<void> {
    try {
      // Find all scenes in the chapter and invalidate their breadcrumbs
      const scenePattern = `breadcrumb:*`;
      const breadcrumbKeys = await redis.keys(scenePattern);
      
      if (breadcrumbKeys.length > 0) {
        await redis.del(...breadcrumbKeys);
      }
    } catch (error) {
      console.error('Failed to invalidate breadcrumb cache:', error);
    }
  }

  // Bulk cache operations for performance
  static async setBulkCache(operations: Array<{
    key: string;
    value: any;
    ttl: number;
  }>): Promise<void> {
    try {
      const pipeline = redis.pipeline();
      
      operations.forEach(({ key, value, ttl }) => {
        pipeline.setex(key, ttl, typeof value === 'string' ? value : JSON.stringify(value));
      });
      
      await pipeline.exec();
    } catch (error) {
      console.error('Failed to execute bulk cache operations:', error);
    }
  }

  // Cache warming for popular content
  static async warmCache(bookId: string, hierarchy: OptimizedHierarchy): Promise<void> {
    try {
      const operations = [
        {
          key: CACHE_KEYS.hierarchy(bookId),
          value: hierarchy,
          ttl: CACHE_TTL.hierarchy
        },
        {
          key: CACHE_KEYS.hierarchyMetadata(bookId),
          value: {
            totalStories: hierarchy.stories.length,
            totalParts: hierarchy.stories.reduce((sum, story) => sum + story.parts.length, 0),
            totalChapters: hierarchy.stories.reduce((sum, story) => 
              sum + story.parts.reduce((partSum, part) => partSum + part.chapters.length, 0), 0
            ),
            totalScenes: hierarchy.stories.reduce((sum, story) => 
              sum + story.parts.reduce((partSum, part) => 
                partSum + part.chapters.reduce((chapterSum, chapter) => 
                  chapterSum + chapter.scenes.length, 0
                ), 0
              ), 0
            ),
            lastUpdated: new Date().toISOString()
          },
          ttl: CACHE_TTL.metadata
        }
      ];

      await this.setBulkCache(operations);
    } catch (error) {
      console.error('Failed to warm cache:', error);
    }
  }

  // Cache performance monitoring
  static async getCacheStats(): Promise<{
    hitRate: number;
    totalKeys: number;
    memoryUsage: string;
  }> {
    try {
      // In a real Redis instance, you would use INFO command
      // For Upstash Redis, we'll simulate this
      const allKeys = await redis.keys('*');
      
      return {
        hitRate: 0.85, // Would be calculated from actual hit/miss stats
        totalKeys: allKeys.length,
        memoryUsage: '64MB' // Would be from Redis INFO command
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        hitRate: 0,
        totalKeys: 0,
        memoryUsage: 'Unknown'
      };
    }
  }

  // Distributed cache locking for cache stampede prevention
  static async acquireLock(lockKey: string, ttl: number = 30): Promise<boolean> {
    try {
      const result = await redis.set(`lock:${lockKey}`, 'locked', { ex: ttl, nx: true });
      return result === 'OK';
    } catch (error) {
      console.error('Failed to acquire cache lock:', error);
      return false;
    }
  }

  static async releaseLock(lockKey: string): Promise<void> {
    try {
      await redis.del(`lock:${lockKey}`);
    } catch (error) {
      console.error('Failed to release cache lock:', error);
    }
  }

  // Cache-aside pattern implementation
  static async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached as string);
      }

      // If not in cache, acquire lock to prevent stampede
      const lockKey = `fetch:${key}`;
      const lockAcquired = await this.acquireLock(lockKey, 10);
      
      if (!lockAcquired) {
        // Another process is fetching, wait and try cache again
        await new Promise(resolve => setTimeout(resolve, 100));
        const retryCache = await redis.get(key);
        if (retryCache) {
          return JSON.parse(retryCache as string);
        }
        // If still not available, proceed with fetch
      }

      try {
        const result = await fetchFunction();
        await redis.setex(key, ttl, JSON.stringify(result));
        return result;
      } finally {
        if (lockAcquired) {
          await this.releaseLock(lockKey);
        }
      }
    } catch (error) {
      console.error('Cache-aside operation failed:', error);
      // Fallback to direct fetch
      return await fetchFunction();
    }
  }
}

// Export singleton instance
export const hierarchyCache = HierarchyCacheManager;
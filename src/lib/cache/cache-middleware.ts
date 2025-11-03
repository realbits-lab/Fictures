/**
 * Auto-Cache Middleware
 *
 * Automatically detects mutation operations and invalidates caches.
 * Reduces boilerplate by auto-detecting entity type from URL patterns.
 *
 * Usage:
 *   export const PATCH = withAutoCache(async (request, { params }) => {
 *     // ... mutation logic ...
 *     return NextResponse.json(data);
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  EntityType,
  createInvalidationContext,
  invalidateEntityCache,
  getCacheInvalidationHeaders,
  extractInvalidationContext,
} from './unified-invalidation';

/**
 * Route handler type
 */
export type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Auto-cache options
 */
export interface AutoCacheOptions {
  /**
   * Disable automatic cache invalidation
   * Useful for routes that handle invalidation manually
   */
  disabled?: boolean;

  /**
   * Custom entity type extraction
   * Override auto-detection from URL
   */
  entityType?: EntityType;

  /**
   * Additional cache keys to invalidate
   */
  additionalKeys?: string[];

  /**
   * Custom invalidation logic
   */
  onInvalidate?: (context: ReturnType<typeof createInvalidationContext>) => Promise<void>;
}

/**
 * Wrap a route handler with automatic cache invalidation
 *
 * Automatically:
 * - Detects mutation operations (POST, PATCH, PUT, DELETE)
 * - Extracts entity type and IDs from URL and response
 * - Invalidates server-side caches (Redis)
 * - Adds client-side invalidation headers
 *
 * @param handler - The route handler to wrap
 * @param options - Auto-cache configuration
 */
export function withAutoCache(
  handler: RouteHandler,
  options: AutoCacheOptions = {}
): RouteHandler {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    // Execute the original handler
    const response = await handler(request, context);

    // Skip cache invalidation if disabled
    if (options.disabled) {
      return response;
    }

    // Only invalidate for mutation operations
    const method = request.method;
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return response;
    }

    try {
      // Extract response data for context
      const responseClone = response.clone();
      const responseData = await responseClone.json().catch(() => ({}));

      // Auto-detect invalidation context from URL and response
      let invalidationContext = extractInvalidationContext(request.url, responseData);

      // Override entity type if specified
      if (options.entityType && invalidationContext) {
        invalidationContext = {
          ...invalidationContext,
          entityType: options.entityType,
        };
      }

      // If we have a valid context, invalidate caches
      if (invalidationContext) {
        // Invalidate server-side caches
        await invalidateEntityCache(invalidationContext);

        // Call custom invalidation logic if provided
        if (options.onInvalidate) {
          await options.onInvalidate(invalidationContext);
        }

        // Add client-side invalidation headers
        const headers = getCacheInvalidationHeaders(invalidationContext);
        const newHeaders = new Headers(response.headers);
        Object.entries(headers).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });

        // Return response with updated headers
        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }

      return response;
    } catch (error) {
      // Don't fail the request if cache invalidation fails
      console.error('[Auto-Cache Middleware] Cache invalidation failed:', error);
      return response;
    }
  };
}

/**
 * Create a middleware that automatically invalidates caches for specific entity types
 *
 * Usage:
 *   const sceneMiddleware = createEntityMiddleware('scene');
 *   export const PATCH = sceneMiddleware(async (request, { params }) => {
 *     // ... mutation logic ...
 *   });
 */
export function createEntityMiddleware(entityType: EntityType) {
  return (handler: RouteHandler, options: Omit<AutoCacheOptions, 'entityType'> = {}) => {
    return withAutoCache(handler, { ...options, entityType });
  };
}

/**
 * Pre-configured middlewares for common entity types
 */
export const withSceneCache = createEntityMiddleware('scene');
export const withChapterCache = createEntityMiddleware('chapter');
export const withStoryCache = createEntityMiddleware('story');
export const withPartCache = createEntityMiddleware('part');
export const withCharacterCache = createEntityMiddleware('character');
export const withSettingCache = createEntityMiddleware('setting');
export const withCommentCache = createEntityMiddleware('comment');
export const withLikeCache = createEntityMiddleware('like');
export const withPostCache = createEntityMiddleware('post');

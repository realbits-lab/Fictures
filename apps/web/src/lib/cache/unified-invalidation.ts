/**
 * Unified Cache Invalidation System
 *
 * Provides centralized cache invalidation across all layers:
 * - Redis (server-side)
 * - localStorage (client-side)
 * - SWR (client-side memory)
 *
 * Usage:
 *   const context = createInvalidationContext({
 *     entityType: 'scene',
 *     entityId: sceneId,
 *     storyId: storyId
 *   });
 *   await invalidateEntityCache(context);
 *   return NextResponse.json(data, {
 *     headers: getCacheInvalidationHeaders(context)
 *   });
 */

import { cacheMetrics } from "./cache-metrics";
import {
    onChapterMutation,
    onCharacterMutation,
    onPartMutation,
    onSceneMutation,
    onSettingMutation,
    onStoryMutation,
} from "./invalidation-hooks";

/**
 * Entity types that can trigger cache invalidation
 */
export type EntityType =
    | "story"
    | "part"
    | "chapter"
    | "scene"
    | "character"
    | "setting"
    | "comment"
    | "like"
    | "post";

/**
 * Cache invalidation context
 */
export interface InvalidationContext {
    entityType: EntityType;
    entityId: string;
    storyId?: string;
    partId?: string;
    chapterId?: string;
    userId?: string;
    additionalData?: Record<string, unknown>;
}

/**
 * Client-side cache types to invalidate
 */
export type ClientCacheType =
    | "writing"
    | "reading"
    | "community"
    | "analysis"
    | "browse";

/**
 * Map entity types to client cache types
 */
const ENTITY_TO_CLIENT_CACHE_MAP: Record<EntityType, ClientCacheType[]> = {
    story: ["writing", "reading", "browse"],
    part: ["writing", "reading"],
    chapter: ["writing", "reading"],
    scene: ["writing", "reading"],
    character: ["writing"],
    setting: ["writing"],
    comment: ["community", "reading"],
    like: ["community"],
    post: ["community"],
};

/**
 * Create invalidation context helper
 */
export function createInvalidationContext(
    params: Omit<InvalidationContext, "additionalData"> & {
        additionalData?: Record<string, unknown>;
    },
): InvalidationContext {
    return {
        entityType: params.entityType,
        entityId: params.entityId,
        storyId: params.storyId,
        partId: params.partId,
        chapterId: params.chapterId,
        userId: params.userId,
        additionalData: params.additionalData,
    };
}

/**
 * Invalidate all caches for an entity
 *
 * This is the main entry point for cache invalidation.
 * Call this after any mutation operation.
 */
export async function invalidateEntityCache(
    context: InvalidationContext,
): Promise<void> {
    const startTime = Date.now();

    try {
        // Call appropriate invalidation hook based on entity type
        switch (context.entityType) {
            case "story":
                await onStoryMutation(context.entityId);
                // cacheMetrics.invalidate("redis", `story:${context.entityId}`);
                break;

            case "part":
                if (!context.storyId) {
                    throw new Error("storyId required for part invalidation");
                }
                await onPartMutation(context.entityId, context.storyId);
                // cacheMetrics.invalidate("redis", `part:${context.entityId}`);
                break;

            case "chapter":
                if (!context.storyId) {
                    throw new Error(
                        "storyId required for chapter invalidation",
                    );
                }
                await onChapterMutation(context.entityId, context.storyId);
                // cacheMetrics.invalidate("redis", `chapter:${context.entityId}`);
                break;

            case "scene":
                if (!context.storyId) {
                    throw new Error("storyId required for scene invalidation");
                }
                await onSceneMutation(context.entityId, context.storyId);
                // cacheMetrics.invalidate("redis", `scene:${context.entityId}`);
                break;

            case "character":
                if (!context.storyId) {
                    throw new Error(
                        "storyId required for character invalidation",
                    );
                }
                await onCharacterMutation(context.entityId, context.storyId);
                // cacheMetrics.invalidate("redis", `character:${context.entityId}`);
                break;

            case "setting":
                if (!context.storyId) {
                    throw new Error(
                        "storyId required for setting invalidation",
                    );
                }
                await onSettingMutation(context.entityId, context.storyId);
                // cacheMetrics.invalidate("redis", `setting:${context.entityId}`);
                break;

            case "comment":
            case "like":
            case "post":
                // Community entities handled separately
                // Import and call community-specific invalidation if needed
                // cacheMetrics.invalidate("redis", `${context.entityType}:${context.entityId}`);
                break;

            default:
                console.warn(
                    `Unknown entity type for cache invalidation: ${context.entityType}`,
                );
        }
    } finally {
        const duration = Date.now() - startTime;
        console.log(
            `[Cache] Invalidated ${context.entityType}:${context.entityId} in ${duration}ms`,
        );
    }
}

/**
 * Get cache invalidation headers for client-side
 *
 * Returns HTTP headers that tell the client which caches to invalidate.
 */
export function getCacheInvalidationHeaders(
    context: InvalidationContext,
): Record<string, string> {
    // Determine which client caches to invalidate
    const clientCaches = ENTITY_TO_CLIENT_CACHE_MAP[context.entityType] || [];

    // Build specific cache keys for SWR invalidation
    const specificKeys: string[] = [];

    // Add entity-specific keys
    specificKeys.push(`${context.entityType}:${context.entityId}`);

    if (context.storyId) {
        specificKeys.push(`story:${context.storyId}`);
    }
    if (context.partId) {
        specificKeys.push(`part:${context.partId}`);
    }
    if (context.chapterId) {
        specificKeys.push(`chapter:${context.chapterId}`);
    }
    if (context.userId) {
        specificKeys.push(`user:${context.userId}`);
    }

    return {
        "X-Cache-Invalidate": clientCaches.join(","),
        "X-Cache-Invalidate-Keys": specificKeys.join(","),
        "X-Cache-Invalidate-Timestamp": new Date().toISOString(),
    };
}

/**
 * Extract invalidation context from URL and response
 *
 * Auto-detects entity type and IDs from API route patterns.
 * Used by auto-cache middleware.
 */
export function extractInvalidationContext(
    url: string,
    responseData: unknown,
): InvalidationContext | null {
    try {
        // Parse URL to extract entity type and ID
        const urlPattern =
            /\/(studio|community)\/api\/(stories|parts|chapters|scenes|characters|settings|posts|comments|likes)\/([^/]+)/;
        const match = url.match(urlPattern);

        if (!match) {
            return null;
        }

        const [, , entityType, entityId] = match;

        // Extract additional IDs from response data if available
        const data = responseData as Record<string, unknown>;
        const storyId = data?.storyId as string | undefined;
        const partId = data?.partId as string | undefined;
        const chapterId = data?.chapterId as string | undefined;

        return createInvalidationContext({
            entityType: entityType as EntityType,
            entityId,
            storyId,
            partId,
            chapterId,
        });
    } catch (error) {
        console.error("Error extracting invalidation context:", error);
        return null;
    }
}

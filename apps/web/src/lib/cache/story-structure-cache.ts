/**
 * Story Structure Cache Utility
 *
 * Implements Option A - Redis Caching Strategy for optimized read performance
 *
 * Features:
 * - Full story hierarchy caching (story + parts + chapters + scenes + characters + settings)
 * - Automatic cache invalidation on mutations
 * - Cache warming for frequently accessed stories
 * - TTL-based expiration (30min for published, 3min for drafts)
 * - Fallback to in-memory cache when Redis unavailable
 */

import { eq } from "drizzle-orm";
import { db } from "../db";
import { getStoryWithStructure } from "../db/queries";
import { characters, settings } from "@/lib/schemas/database";
import { getCache } from "./redis-cache";

// Cache TTL Configuration
const CACHE_TTL = {
    PUBLISHED_STORY: 1800, // 30 minutes for published stories
    DRAFT_STORY: 180, // 3 minutes for draft stories
    STRUCTURE: 1800, // 30 minutes for structure metadata
    LIST: 600, // 10 minutes for story lists
};

// Cache Key Patterns
const CACHE_KEYS = {
    fullStructure: (storyId: string, userId?: string) =>
        userId
            ? `story:${storyId}:structure:user:${userId}`
            : `story:${storyId}:structure:public`,
    partIds: (storyId: string) => `story:${storyId}:partIds`,
    chapterIds: (storyId: string) => `story:${storyId}:chapterIds`,
    sceneIds: (storyId: string) => `story:${storyId}:sceneIds`,
    characterIds: (storyId: string) => `story:${storyId}:characterIds`,
    settingIds: (storyId: string) => `story:${storyId}:settingIds`,
    storyPattern: (storyId: string) => `story:${storyId}:*`,
};

/**
 * Story Structure Interface - Full hierarchy with all relationships
 */
export interface CachedStoryStructure {
    story: any;
    partIds: string[];
    chapterIds: string[];
    sceneIds: string[];
    characterIds: string[];
    settingIds: string[];
    parts: any[];
    chapters: any[];
    scenes: any[];
    characters: any[];
    settings: any[];
    cachedAt: string;
    ttl: number;
}

/**
 * Get full story structure with caching
 * This is the main entry point for reading story data
 */
export async function getCachedStoryStructure(
    storyId: string,
    userId?: string,
): Promise<CachedStoryStructure | null> {
    const cache = getCache();
    const cacheKey = CACHE_KEYS.fullStructure(storyId, userId);

    // Try cache first
    const cached = await cache.get<CachedStoryStructure>(cacheKey);
    if (cached) {
        console.log(
            `[StoryCache] ✅ HIT: Full structure for ${storyId} (age: ${Date.now() - new Date(cached.cachedAt).getTime()}ms)`,
        );
        return cached;
    }

    console.log(
        `[StoryCache] ❌ MISS: Full structure for ${storyId} - fetching from DB`,
    );

    // Cache miss - build structure from database
    const structure = await buildStoryStructure(storyId, userId);

    if (!structure) {
        return null;
    }

    // Determine TTL based on story status
    const ttl =
        structure.story.status === "published"
            ? CACHE_TTL.PUBLISHED_STORY
            : CACHE_TTL.DRAFT_STORY;

    // Cache the full structure
    await cache.set(cacheKey, structure, ttl);

    // Also cache individual ID arrays for quick lookups
    await Promise.all([
        cache.set(CACHE_KEYS.partIds(storyId), structure.partIds, ttl),
        cache.set(CACHE_KEYS.chapterIds(storyId), structure.chapterIds, ttl),
        cache.set(CACHE_KEYS.sceneIds(storyId), structure.sceneIds, ttl),
        cache.set(
            CACHE_KEYS.characterIds(storyId),
            structure.characterIds,
            ttl,
        ),
        cache.set(CACHE_KEYS.settingIds(storyId), structure.settingIds, ttl),
    ]);

    console.log(
        `[StoryCache] 💾 SET: Full structure for ${storyId} (TTL: ${ttl}s, ${structure.parts.length} parts, ${structure.chapters.length} chapters, ${structure.scenes.length} scenes)`,
    );

    return structure;
}

/**
 * Build story structure from database
 */
async function buildStoryStructure(
    storyId: string,
    _userId?: string,
): Promise<CachedStoryStructure | null> {
    // Get story with full hierarchy using existing query
    const story = await getStoryWithStructure(storyId, true);

    if (!story) {
        return null;
    }

    // Get characters
    const storyCharacters = await db.query.characters.findMany({
        where: eq(characters.storyId, storyId),
    });

    // Get settings (places/locations)
    const storySettings = await db.query.settings.findMany({
        where: eq(settings.storyId, storyId),
    });

    // Extract all IDs
    const partIds = story.parts.map((p: any) => p.id);
    const chapterIds = [
        ...story.parts.flatMap((p: any) => p.chapters.map((c: any) => c.id)),
        ...story.chapters.map((c: any) => c.id),
    ];
    const sceneIds = [
        ...story.parts.flatMap((p: any) =>
            p.chapters.flatMap(
                (c: any) => c.scenes?.map((s: any) => s.id) || [],
            ),
        ),
        ...story.chapters.flatMap(
            (c: any) => c.scenes?.map((s: any) => s.id) || [],
        ),
    ];
    const characterIds = storyCharacters.map((c) => c.id);
    const settingIds = storySettings.map((s) => s.id);

    // Build all scenes array
    const allScenes = [
        ...story.parts.flatMap((p: any) =>
            p.chapters.flatMap((c: any) => c.scenes || []),
        ),
        ...story.chapters.flatMap((c: any) => c.scenes || []),
    ];

    // Build all chapters array
    const allChapters = [
        ...story.parts.flatMap((p: any) => p.chapters),
        ...story.chapters,
    ];

    return {
        story: {
            id: story.id,
            title: story.title,
            genre: story.genre,
            status: story.status,
            userId: story.userId,
            createdAt: story.createdAt,
            updatedAt: story.updatedAt,
        },
        partIds,
        chapterIds,
        sceneIds,
        characterIds,
        settingIds,
        parts: story.parts,
        chapters: allChapters,
        scenes: allScenes,
        characters: storyCharacters,
        settings: storySettings,
        cachedAt: new Date().toISOString(),
        ttl:
            story.status === "published"
                ? CACHE_TTL.PUBLISHED_STORY
                : CACHE_TTL.DRAFT_STORY,
    };
}

/**
 * Get only entity IDs (lightweight query)
 */
export async function getCachedEntityIds(storyId: string): Promise<{
    partIds: string[];
    chapterIds: string[];
    sceneIds: string[];
    characterIds: string[];
    settingIds: string[];
} | null> {
    const cache = getCache();

    // Try to get from individual ID caches
    const [partIds, chapterIds, sceneIds, characterIds, settingIds] =
        await Promise.all([
            cache.get<string[]>(CACHE_KEYS.partIds(storyId)),
            cache.get<string[]>(CACHE_KEYS.chapterIds(storyId)),
            cache.get<string[]>(CACHE_KEYS.sceneIds(storyId)),
            cache.get<string[]>(CACHE_KEYS.characterIds(storyId)),
            cache.get<string[]>(CACHE_KEYS.settingIds(storyId)),
        ]);

    // If all IDs are cached, return them
    if (partIds && chapterIds && sceneIds && characterIds && settingIds) {
        return { partIds, chapterIds, sceneIds, characterIds, settingIds };
    }

    // Otherwise, get full structure (which will cache IDs)
    const structure = await getCachedStoryStructure(storyId);
    if (!structure) {
        return null;
    }

    return {
        partIds: structure.partIds,
        chapterIds: structure.chapterIds,
        sceneIds: structure.sceneIds,
        characterIds: structure.characterIds,
        settingIds: structure.settingIds,
    };
}

/**
 * Invalidate all cache entries for a story
 */
export async function invalidateStoryCache(storyId: string): Promise<void> {
    const cache = getCache();

    // Delete all cache keys matching the story pattern
    await cache.delPattern(CACHE_KEYS.storyPattern(storyId));

    console.log(
        `[StoryCache] 🗑️ INVALIDATED: All cache entries for story ${storyId}`,
    );
}

/**
 * Invalidate cache when specific entities are modified
 */
export async function invalidateCacheForEntity(
    entityType: "part" | "chapter" | "scene" | "character" | "setting",
    entityId: string,
    storyId: string,
): Promise<void> {
    const _cache = getCache();

    // Invalidate the full story structure
    await invalidateStoryCache(storyId);

    console.log(
        `[StoryCache] 🗑️ INVALIDATED: Cache for ${entityType} ${entityId} in story ${storyId}`,
    );
}

/**
 * Warm cache for frequently accessed stories
 */
export async function warmStoryCache(storyIds: string[]): Promise<void> {
    console.log(
        `[StoryCache] 🔥 Warming cache for ${storyIds.length} stories...`,
    );

    const startTime = Date.now();

    await Promise.all(
        storyIds.map((storyId) => getCachedStoryStructure(storyId)),
    );

    const duration = Date.now() - startTime;
    console.log(
        `[StoryCache] ✅ Cache warmed for ${storyIds.length} stories in ${duration}ms`,
    );
}

/**
 * Get cache statistics for monitoring
 */
export async function getStoryCacheStats() {
    const cache = getCache();
    return cache.getMetrics();
}

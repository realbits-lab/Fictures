/**
 * Studio-optimized database queries with Redis caching
 *
 * Optimizations:
 * - Redis caching for user story lists (3-minute TTL for drafts)
 * - Smart column selection (list view vs detail view)
 * - Query batching with Promise.all
 * - Cache invalidation on write operations
 */

import { and, desc, eq, inArray } from "drizzle-orm";
import { getCache } from "@/lib/cache/redis-cache";
import { chapters, parts, stories } from "@/lib/schemas/database";
import { db } from "./index";

// Cache TTL configuration
const CACHE_TTL = {
    STUDIO_DRAFT_LIST: 180, // 3 minutes for active editing
    STUDIO_DRAFT_STORY: 180, // 3 minutes for draft stories
    STUDIO_PUBLISHED_STORY: 1800, // 30 minutes for published stories
};

// Cache key generators
const CACHE_KEYS = {
    userStories: (userId: string) => `fictures:studio:stories:user:${userId}`,
    userStory: (storyId: string, userId: string) =>
        `fictures:studio:story:${storyId}:user:${userId}`,
    publicStory: (storyId: string) => `fictures:studio:story:${storyId}:public`,
};

/**
 * Get user stories with smart caching and column selection
 * List view: Skip heavy fields like imageVariants (~125 KB per story)
 */
export async function getCachedUserStories(userId: string) {
    const cache = getCache();
    const cacheKey = CACHE_KEYS.userStories(userId);

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
        console.log(`[StudioCache] ✅ HIT: User stories for ${userId}`);
        return cached;
    }

    console.log(
        `[StudioCache] ❌ MISS: User stories for ${userId} - fetching from DB`,
    );
    const startTime = Date.now();

    // Query 1: Get all user stories with smart column selection
    const userStories = await db
        .select({
            id: stories.id,
            title: stories.title,
            summary: stories.summary, // ✅ INCLUDE: Story summary for card descriptions
            genre: stories.genre,
            status: stories.status,
            authorId: stories.authorId,
            viewCount: stories.viewCount,
            rating: stories.rating,
            ratingCount: stories.ratingCount,
            updatedAt: stories.updatedAt,
            createdAt: stories.createdAt,
            imageUrl: stories.imageUrl,
            imageVariants: stories.imageVariants, // ✅ INCLUDE: Needed for API response transformation
            // ❌ SKIP heavy fields for list view:
            // - moralFramework - not needed for list
            // - hnsData - removed from schema (legacy field)
        })
        .from(stories)
        .where(eq(stories.authorId, userId))
        .orderBy(desc(stories.updatedAt));

    if (userStories.length === 0) {
        const result: any[] = [];
        await cache.set(cacheKey, result, CACHE_TTL.STUDIO_DRAFT_LIST);
        console.log(
            `[StudioCache] 💾 SET: User stories for ${userId} (0 stories, TTL: ${CACHE_TTL.STUDIO_DRAFT_LIST}s)`,
        );
        return result;
    }

    // Extract story IDs for subsequent queries
    const storyIds = userStories.map((story) => story.id);

    // Query 2: Get all chapters for all user stories (batched)
    // Query 3: Get all parts for all user stories (batched)
    const [allChapters, allParts] = await Promise.all([
        db
            .select({
                storyId: chapters.storyId,
                id: chapters.id,
                orderIndex: chapters.orderIndex,
                status: chapters.status,
            })
            .from(chapters)
            .where(inArray(chapters.storyId, storyIds))
            .orderBy(chapters.orderIndex),

        db
            .select({
                storyId: parts.storyId,
                id: parts.id,
            })
            .from(parts)
            .where(inArray(parts.storyId, storyIds)),
    ]);

    // Process data efficiently in memory
    const storiesWithData = userStories.map((story) => {
        const storyChapters = allChapters.filter(
            (ch) => ch.storyId === story.id,
        );
        const storyParts = allParts.filter((pt) => pt.storyId === story.id);

        // Get first chapter (already ordered by orderIndex)
        const firstChapter = storyChapters.length > 0 ? storyChapters[0] : null;

        // Count completed chapters
        const completedChapters = storyChapters.filter(
            (ch) => ch.status === "published",
        ).length;

        // Check if story is actually published (has published chapters AND is public)
        const hasPublishedChapters = storyChapters.some(
            (chapter) => chapter.status === "published",
        );
        const actualStatus =
            story.status === "published" && hasPublishedChapters
                ? ("published" as const)
                : (story.status as any);

        return {
            ...story,
            status: actualStatus,
            firstChapterId: firstChapter?.id || null,
            totalChapters: storyChapters.length,
            completedChapters,
            totalParts: storyParts.length,
            completedParts: storyParts.length,
        };
    });

    const duration = Date.now() - startTime;

    // Cache the result
    await cache.set(cacheKey, storiesWithData, CACHE_TTL.STUDIO_DRAFT_LIST);
    console.log(
        `[StudioCache] 💾 SET: User stories for ${userId} (${storiesWithData.length} stories, TTL: ${CACHE_TTL.STUDIO_DRAFT_LIST}s, ${duration}ms)`,
    );

    return storiesWithData;
}

/**
 * Get single story with full details (for edit page)
 * Detail view: Include ALL fields including imageVariants
 */
export async function getCachedStoryDetail(storyId: string, userId: string) {
    const cache = getCache();

    // Try cache based on story status
    const story = await db
        .select()
        .from(stories)
        .where(and(eq(stories.id, storyId), eq(stories.authorId, userId)))
        .limit(1);

    if (!story[0]) {
        return null;
    }

    const isPublished = story[0].status === "published";
    const cacheKey = isPublished
        ? CACHE_KEYS.publicStory(storyId)
        : CACHE_KEYS.userStory(storyId, userId);

    const cacheTTL = isPublished
        ? CACHE_TTL.STUDIO_PUBLISHED_STORY
        : CACHE_TTL.STUDIO_DRAFT_STORY;

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
        console.log(
            `[StudioCache] ✅ HIT: Story detail ${storyId} (${isPublished ? "published" : "draft"})`,
        );
        return cached;
    }

    console.log(
        `[StudioCache] ❌ MISS: Story detail ${storyId} - fetching from DB`,
    );

    // Cache the full story data (includes imageVariants for detail view)
    await cache.set(cacheKey, story[0], cacheTTL);
    console.log(
        `[StudioCache] 💾 SET: Story detail ${storyId} (TTL: ${cacheTTL}s)`,
    );

    return story[0];
}

/**
 * Invalidate cache when user modifies stories
 */
export async function invalidateStudioCache(userId: string, storyId?: string) {
    const cache = getCache();

    const keysToInvalidate = [CACHE_KEYS.userStories(userId)];

    if (storyId) {
        keysToInvalidate.push(
            CACHE_KEYS.userStory(storyId, userId),
            CACHE_KEYS.publicStory(storyId),
        );
    }

    await Promise.all(keysToInvalidate.map((key) => cache.del(key)));
    console.log(
        `[StudioCache] 🗑️  INVALIDATED: ${keysToInvalidate.length} keys for user ${userId}`,
    );
}

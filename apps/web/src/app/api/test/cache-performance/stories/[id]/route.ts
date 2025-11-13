import { and, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chapters, scenes, stories } from "@/lib/db/schema";

// Redis caching disabled for this test to focus on database and client-side caching
const redis: null = null;

const CACHE_CONFIG = {
    TTL_PUBLIC: 600, // 10 minutes for published stories
    TTL_PRIVATE: 180, // 3 minutes for writing stories
    PREFIX: "fictures:cache-test:story",
};

/**
 * GET /api/test/cache-performance/stories/[id]
 *
 * Returns single story with full caching implementation:
 * - Layer 3: Redis cache (server-side)
 * - Layer 2: localStorage (handled by client)
 * - Layer 1: SWR memory (handled by client)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: storyId } = await params;
        const startTime = Date.now();

        // Check Redis cache first (Layer 3)
        const cacheKey = `${CACHE_CONFIG.PREFIX}:${storyId}:public`;
        if (redis) {
            const cachedData = await (redis as any).get(cacheKey);

            if (cachedData) {
                const duration = Date.now() - startTime;
                console.log(
                    `[Cache Test API] Redis HIT for story ${storyId} (${duration}ms)`,
                );

                return NextResponse.json(cachedData, {
                    headers: {
                        "X-Response-Time": `${duration}ms`,
                        "X-Cache-Hit": "true",
                        "X-Cache-Source": "redis",
                    },
                });
            }

            // Cache MISS - fetch from database
            console.log(`[Cache Test API] Redis MISS for story ${storyId}`);
        } else {
            console.log(
                `[Cache Test API] Redis not available, fetching from database`,
            );
        }

        // Fetch story
        const story = await db.query.stories.findFirst({
            where: eq(stories.id, storyId),
        });

        if (!story) {
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        // Fetch chapters
        const storyChapters = await db.query.chapters.findMany({
            where: eq(chapters.storyId, storyId),
            orderBy: (chapters, { asc }) => [asc(chapters.orderIndex)],
        });

        // Fetch all scenes in ONE query (avoiding N+1 problem)
        const chapterIds = storyChapters.map((c) => c.id);
        const allScenes =
            chapterIds.length > 0
                ? await db.query.scenes.findMany({
                      where: sql`${scenes.chapterId} IN (${sql.join(
                          chapterIds.map((id) => sql`${id}`),
                          sql`, `,
                      )})`,
                      orderBy: (scenes, { asc }) => [asc(scenes.orderIndex)],
                  })
                : [];

        // Group scenes by chapter
        const scenesByChapter: Record<string, typeof allScenes> = {};
        for (const scene of allScenes) {
            if (!scenesByChapter[scene.chapterId]) {
                scenesByChapter[scene.chapterId] = [];
            }
            scenesByChapter[scene.chapterId].push(scene);
        }

        // Construct response
        const responseData = {
            id: story.id,
            title: story.title,
            genre: story.genre,
            status: story.status,
            summary: story.summary,
            tone: story.tone,
            moralFramework: story.moralFramework,
            viewCount: story.viewCount,
            imageUrl: story.imageUrl,
            chaptersCount: storyChapters.length,
            scenesCount: allScenes.length,
            chapters: storyChapters.map((chapter) => ({
                id: chapter.id,
                title: chapter.title,
                summary: chapter.summary,
                orderIndex: chapter.orderIndex,
                status: chapter.status,
                scenesCount: scenesByChapter[chapter.id]?.length || 0,
                scenes: scenesByChapter[chapter.id] || [],
            })),
            createdAt: story.createdAt,
            updatedAt: story.updatedAt,
        };

        // Store in Redis cache
        const isPublished = story.status === "published";
        const ttl = isPublished
            ? CACHE_CONFIG.TTL_PUBLIC
            : CACHE_CONFIG.TTL_PRIVATE;

        if (redis) {
            await (redis as any).set(cacheKey, responseData, { ex: ttl });
        }

        const duration = Date.now() - startTime;
        console.log(
            `[Cache Test API] Database query for story ${storyId} (${duration}ms), cached with TTL ${ttl}s`,
        );

        return NextResponse.json(responseData, {
            headers: {
                "X-Response-Time": `${duration}ms`,
                "X-Cache-Hit": "false",
                "X-Cache-Source": "database",
                "X-Cache-TTL": `${ttl}s`,
            },
        });
    } catch (error: any) {
        console.error("[Cache Test API] Error fetching story:", error);
        return NextResponse.json(
            { error: "Failed to fetch story", details: error.message },
            { status: 500 },
        );
    }
}

/**
 * PATCH /api/test/cache-performance/stories/[id]
 *
 * Updates story and invalidates cache
 * Tests cache invalidation behavior
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: storyId } = await params;
        const body = await request.json();

        console.log(`[Cache Test API] Updating story ${storyId}:`, body);

        // Update story
        const [updatedStory] = await db
            .update(stories)
            .set({
                ...body,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(stories.id, storyId))
            .returning();

        if (!updatedStory) {
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        // Invalidate cache
        const cacheKey = `${CACHE_CONFIG.PREFIX}:${storyId}:public`;
        if (redis) {
            await (redis as any).del(cacheKey);
        }

        console.log(`[Cache Test API] Invalidated cache for story ${storyId}`);

        return NextResponse.json({
            success: true,
            story: updatedStory,
            cacheInvalidated: true,
        });
    } catch (error: any) {
        console.error("[Cache Test API] Error updating story:", error);
        return NextResponse.json(
            { error: "Failed to update story", details: error.message },
            { status: 500 },
        );
    }
}

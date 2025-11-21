import { type NextRequest, NextResponse } from "next/server";
import { getPerformanceLogger } from "@/lib/cache/performance-logger";
import { getCommunityPosts } from "@/lib/db/cached-queries";

/**
 * GET /api/community/stories/[storyId]/posts
 * Get all posts for a specific story
 *
 * Caching:
 * - Redis: 1 hour (public content, shared by all users)
 * - Client SWR: 30 minutes
 * - localStorage: 1 hour
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ storyId: string }> },
) {
    const perfLogger = getPerformanceLogger();
    const operationId = `get-community-posts-${Date.now()}`;

    try {
        const { storyId } = await params;

        if (!storyId) {
            return NextResponse.json(
                { error: "Bad Request", message: "Story ID is required" },
                { status: 400 },
            );
        }

        perfLogger.start(
            operationId,
            "GET /api/community/stories/[storyId]/posts",
            {
                apiRoute: true,
                storyId,
            },
        );

        const posts = await getCommunityPosts(storyId);

        const totalDuration = perfLogger.end(operationId, {
            cached: true,
            postCount: posts.length,
        });

        return NextResponse.json(
            {
                success: true,
                posts,
                total: posts.length,
            },
            {
                headers: {
                    "X-Server-Timing": `total;dur=${totalDuration}`,
                    "X-Server-Cache": "ENABLED",
                    "Cache-Control":
                        "public, max-age=1800, stale-while-revalidate=3600", // 30min cache, 1hr stale
                },
            },
        );
    } catch (error) {
        perfLogger.end(operationId, { error: true });
        console.error("Error fetching posts:", error);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                message: "Failed to fetch posts",
            },
            { status: 500 },
        );
    }
}

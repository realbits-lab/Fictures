import { createHash } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { getPublishedStories } from "@/lib/db/queries";

export const runtime = "nodejs";

// GET /api/comics/published - Get all published stories for comics browsing
export async function GET(request: NextRequest) {
    const reqId = Math.random().toString(36).substring(7);
    const requestStart = performance.now();

    console.log(
        `[${reqId}] 🌐 GET /api/comics/published - Request started at ${new Date().toISOString()}`,
    );

    try {
        // Fetch published stories
        const dbQueryStart = performance.now();
        const publishedStories = await getPublishedStories();

        const dbQueryEnd = performance.now();
        const dbQueryDuration = Math.round(dbQueryEnd - dbQueryStart);

        console.log(
            `[${reqId}] ✅ Database query completed in ${dbQueryDuration}ms:`,
            {
                storiesCount: publishedStories.length,
            },
        );

        // Build response
        const response = {
            stories: publishedStories,
            count: publishedStories.length,
            metadata: {
                fetchedAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
            },
        };

        // Generate ETag
        const contentForHash = JSON.stringify({
            storiesData: publishedStories.map((story) => ({
                id: story.id,
                title: story.title,
                status: story.status,
                rating: story.rating,
                viewCount: story.viewCount,
            })),
            totalCount: publishedStories.length,
            lastUpdated: response.metadata.lastUpdated,
        });
        const etag = createHash("md5").update(contentForHash).digest("hex");

        // Check if client has the same version
        const clientETag = request.headers.get("if-none-match");

        if (clientETag === etag) {
            const totalTime = Math.round(performance.now() - requestStart);
            console.log(
                `[${reqId}] 🎯 304 Not Modified (${totalTime}ms total)`,
            );
            return new NextResponse(null, { status: 304 });
        }

        // Set cache headers
        const responseJson = JSON.stringify(response);

        const headers = new Headers({
            "Content-Type": "application/json",
            ETag: etag,
            "Cache-Control":
                "public, max-age=1800, stale-while-revalidate=3600",
            "X-Content-Type": "published-stories",
            "X-Response-Time": `${Math.round(performance.now() - requestStart)}ms`,
            "X-Stories-Count": publishedStories.length.toString(),
        });

        const totalTime = Math.round(performance.now() - requestStart);
        console.log(
            `[${reqId}] ✅ 200 OK - ${publishedStories.length} stories in ${totalTime}ms`,
        );

        return new NextResponse(responseJson, {
            status: 200,
            headers,
        });
    } catch (error) {
        const errorTime = Math.round(performance.now() - requestStart);
        console.error(`[${reqId}] ❌ Request failed after ${errorTime}ms:`, {
            error: error instanceof Error ? error.message : "Unknown error",
        });

        return NextResponse.json(
            {
                error: "Internal server error",
                message:
                    error instanceof Error ? error.message : "Unknown error",
                reqId,
            },
            { status: 500 },
        );
    }
}

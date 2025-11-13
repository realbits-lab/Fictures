import { createHash } from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStoryWithStructure } from "@/lib/db/queries";

export const runtime = "nodejs";

// GET /api/stories/[id]/structure - Get story with complete structure (parts, chapters, scenes)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const session = await auth();

        const storyWithStructure = await getStoryWithStructure(
            id,
            true,
            session?.user?.id,
        );

        if (!storyWithStructure) {
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        const response = {
            ...storyWithStructure,
            metadata: {
                fetchedAt: new Date().toISOString(),
                structureVersion: "full-with-scenes",
                lastModified: new Date().toISOString(),
            },
        };

        // Generate ETag based on complete story structure
        const allChapters = [
            ...storyWithStructure.parts.flatMap((part) => part.chapters),
            ...storyWithStructure.chapters,
        ];
        const allScenes = allChapters.flatMap(
            (chapter) => chapter.scenes || [],
        );

        const contentForHash = JSON.stringify({
            storyId: storyWithStructure.id,
            partsData: storyWithStructure.parts.map((part) => ({
                id: part.id,
                title: part.title,
                orderIndex: part.orderIndex,
            })),
            chaptersData: allChapters.map((ch) => ({
                id: ch.id,
                title: ch.title,
                orderIndex: ch.orderIndex,
                status: ch.status,
            })),
            scenesData: allScenes.map((sc) => ({
                id: sc.id,
                title: sc.title,
                orderIndex: sc.orderIndex,
                status: sc.status,
            })),
        });
        const etag = createHash("md5").update(contentForHash).digest("hex");

        // Check if client has the same version
        const clientETag = request.headers.get("if-none-match");
        if (clientETag === etag) {
            return new NextResponse(null, { status: 304 });
        }

        // Set cache headers for structure API
        const isOwner = storyWithStructure.userId === session?.user?.id;
        const headers = new Headers({
            "Content-Type": "application/json",
            ETag: etag,
            // Shorter cache for owners (they edit), longer for readers
            "Cache-Control": isOwner
                ? "private, max-age=600, stale-while-revalidate=1200" // 10min cache, 20min stale
                : "public, max-age=1800, stale-while-revalidate=3600", // 30min cache, 1hr stale
            "X-Content-Type": "story-structure",
            "X-Last-Modified": response.metadata.lastModified,
        });

        return new NextResponse(JSON.stringify(response), {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error("Error fetching story structure:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

/**
 * GET /api/studio/chapters/[chapterId]/scenes
 *
 * Returns all scenes for a specific chapter
 */

import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chapters, scenes } from "@/lib/schemas/database";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ chapterId: string }> },
) {
    const startTime = Date.now();
    const { chapterId } = await params;

    try {
        // 1. Verify chapter exists
        const chapter = await db
            .select({ id: chapters.id })
            .from(chapters)
            .where(eq(chapters.id, chapterId))
            .limit(1);

        if (chapter.length === 0) {
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 },
            );
        }

        // 2. Get all scenes for this chapter
        const chapterScenes = await db
            .select({
                id: scenes.id,
                title: scenes.title,
                content: scenes.content,
                orderIndex: scenes.orderIndex,
                novelStatus: scenes.novelStatus,
                imageUrl: scenes.imageUrl,
                imageVariants: scenes.imageVariants,
            })
            .from(scenes)
            .where(eq(scenes.chapterId, chapterId))
            .orderBy(asc(scenes.orderIndex));

        // 3. Format response
        const response = {
            scenes: chapterScenes.map((scene) => ({
                id: scene.id,
                title: scene.title,
                content: scene.content,
                orderIndex: scene.orderIndex,
                status: scene.novelStatus || "draft",
                imageUrl: scene.imageUrl,
                imageVariants: scene.imageVariants,
            })),
            metadata: {
                fetchedAt: new Date().toISOString(),
                chapterId,
                totalScenes: chapterScenes.length,
            },
        };

        // 4. Generate ETag for caching
        const responseString = JSON.stringify(response);
        const encoder = new TextEncoder();
        const data = encoder.encode(responseString);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const etag = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
            .substring(0, 16);

        // 5. Check If-None-Match header
        const clientETag = request.headers.get("If-None-Match");
        if (clientETag === etag) {
            return new NextResponse(null, {
                status: 304,
                headers: {
                    ETag: etag,
                    "Cache-Control": "public, max-age=300",
                },
            });
        }

        const duration = Date.now() - startTime;
        console.log(
            `[ChapterScenes] GET /api/studio/chapters/${chapterId}/scenes - ${chapterScenes.length} scenes in ${duration}ms`,
        );

        return NextResponse.json(response, {
            headers: {
                ETag: etag,
                "Cache-Control": "public, max-age=300",
            },
        });
    } catch (error) {
        console.error("[ChapterScenes] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch scenes" },
            { status: 500 },
        );
    }
}

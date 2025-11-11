/**
 * Scene Summaries API Route
 *
 * GET /studio/api/scene-summaries - Get scenes for a chapter
 * POST /studio/api/scene-summaries - Generate scene summaries using AI
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required
 */

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { chapters, scenes, stories } from "@/lib/db/schema";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { sceneSummariesService } from "@/lib/studio/services";
import type {
    GenerateSceneSummariesErrorResponse,
    GenerateSceneSummariesRequest,
    GenerateSceneSummariesResponse,
} from "../types";
import { generateSceneSummariesSchema } from "../validation-schemas";

export const runtime = "nodejs";

/**
 * GET /studio/api/scene-summaries
 *
 * Get scenes for a chapter
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request);

        if (!authResult) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { searchParams } = new URL(request.url);
        const chapterId = searchParams.get("chapterId");

        if (!chapterId) {
            return NextResponse.json(
                { error: "chapterId parameter is required" },
                { status: 400 },
            );
        }

        // Get chapter and check access
        const [chapter] = await db
            .select()
            .from(chapters)
            .where(eq(chapters.id, chapterId));
        if (!chapter) {
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 },
            );
        }

        // Get story and check access permissions
        const [story] = await db
            .select()
            .from(stories)
            .where(eq(stories.id, chapter.storyId));
        if (!story) {
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        // Check access permissions - only allow author access for now
        if (story.authorId !== authResult.user.id) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 },
            );
        }

        // Get scenes for the chapter
        const chapterScenes = await db
            .select()
            .from(scenes)
            .where(eq(scenes.chapterId, chapterId))
            .orderBy(scenes.orderIndex);

        return NextResponse.json({
            scenes: chapterScenes.map((scene) => ({
                ...scene,
                chapter: {
                    id: chapter.id,
                    title: chapter.title,
                    storyId: chapter.storyId,
                },
                story: {
                    id: story.id,
                    title: story.title,
                    authorId: story.authorId,
                },
            })),
        });
    } catch (error) {
        console.error("Error fetching scenes:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

/**
 * POST /studio/api/scene-summaries
 *
 * Generate scene summaries for a story using AI
 *
 * Required scope: stories:write
 */
export async function POST(request: NextRequest) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📚 [SCENE SUMMARIES API] POST request received");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
        // 1. Authenticate the request
        const authResult = await authenticateRequest(request);

        if (!authResult) {
            console.error("❌ [SCENE SUMMARIES API] Authentication failed");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 2. Check if user has permission to write stories
        if (!hasRequiredScope(authResult, "stories:write")) {
            console.error("❌ [SCENE SUMMARIES API] Insufficient scopes:", {
                required: "stories:write",
                actual: authResult.scopes,
            });
            return NextResponse.json(
                {
                    error: "Insufficient permissions. Required scope: stories:write",
                },
                { status: 403 },
            );
        }

        console.log("✅ [SCENE SUMMARIES API] Authentication successful:", {
            type: authResult.type,
            userId: authResult.user.id,
            email: authResult.user.email,
        });

        // 3. Parse and validate request body
        const body: GenerateSceneSummariesRequest =
            (await request.json()) as GenerateSceneSummariesRequest;
        const validatedData: z.infer<typeof generateSceneSummariesSchema> =
            generateSceneSummariesSchema.parse(body);

        console.log("[SCENE SUMMARIES API] Request parameters:", {
            storyId: validatedData.storyId,
            scenesPerChapter: validatedData.scenesPerChapter,
            language: validatedData.language,
        });

        // 4. Generate using service (handles fetch, validation, generation, persistence)
        console.log(
            "[SCENE SUMMARIES API] 🤖 Calling scene summaries service...",
        );
        const serviceResult = await sceneSummariesService.generateAndSave({
            storyId: validatedData.storyId,
            scenesPerChapter: validatedData.scenesPerChapter ?? 3,
            userId: authResult.user.id,
        });

        console.log(
            "[SCENE SUMMARIES API] ✅ Scene summaries generation and save completed:",
            {
                count: serviceResult.scenes.length,
                generationTime: serviceResult.metadata.generationTime,
            },
        );

        // 5. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[SCENE SUMMARIES API] ✅ Cache invalidated");

        console.log("✅ [SCENE SUMMARIES API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 6. Return typed response
        const response: GenerateSceneSummariesResponse = {
            success: true,
            scenes: serviceResult.scenes,
            metadata: {
                totalGenerated: serviceResult.scenes.length,
                generationTime: serviceResult.metadata.generationTime,
            },
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [SCENE SUMMARIES API] Error:", error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        if (error instanceof z.ZodError) {
            const errorResponse: GenerateSceneSummariesErrorResponse = {
                error: "Invalid input",
                details: error.issues,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        const errorResponse: GenerateSceneSummariesErrorResponse = {
            error: "Failed to generate and save scene summaries",
            details: error instanceof Error ? error.message : "Unknown error",
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}

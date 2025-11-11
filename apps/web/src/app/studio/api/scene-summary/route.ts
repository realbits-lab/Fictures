import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { sceneSummaryService } from "@/lib/studio/services/scene-summary-service";
import type {
    GenerateSceneSummaryErrorResponse,
    GenerateSceneSummaryRequest,
    GenerateSceneSummaryResponse,
} from "../types";

export const runtime = "nodejs";

const generateSceneSummarySchema = z.object({
    storyId: z.string().min(1, "storyId is required"),
    chapterId: z.string().min(1, "chapterId is required"),
});

/**
 * POST /studio/api/scene-summary - Generate ONE next scene summary (Extreme Incremental)
 *
 * Generates the next scene summary in sequence with full context of all previous scenes.
 * This is the extreme incremental approach where scene summaries are generated one at a time.
 */
export async function POST(request: NextRequest) {
    try {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📄 [SCENE-SUMMARY API] POST request received (Singular)");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // 1. Authenticate the request
        const authResult: Awaited<ReturnType<typeof authenticateRequest>> =
            await authenticateRequest(request);

        if (!authResult) {
            console.error("❌ [SCENE-SUMMARY API] Authentication failed");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 2. Check if user has permission to write stories
        if (!hasRequiredScope(authResult, "stories:write")) {
            console.error("❌ [SCENE-SUMMARY API] Insufficient scopes:", {
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

        console.log("✅ [SCENE-SUMMARY API] Authentication successful:", {
            type: authResult.type,
            userId: authResult.user.id,
            email: authResult.user.email,
        });

        // 3. Parse and validate request body with type safety
        const body: GenerateSceneSummaryRequest =
            (await request.json()) as GenerateSceneSummaryRequest;
        const validatedData: z.infer<typeof generateSceneSummarySchema> =
            generateSceneSummarySchema.parse(body);

        console.log("[SCENE-SUMMARY API] Request parameters:", {
            storyId: validatedData.storyId,
            chapterId: validatedData.chapterId,
        });

        // 4. Generate using service (handles fetch, validation, generation, persistence)
        console.log(
            "[SCENE-SUMMARY API] 🤖 Calling scene summary service (singular)...",
        );
        const serviceResult = await sceneSummaryService.generateAndSave({
            storyId: validatedData.storyId,
            chapterId: validatedData.chapterId,
            userId: authResult.user.id,
        });

        console.log(
            "[SCENE-SUMMARY API] ✅ Scene summary generation and save completed:",
            {
                sceneId: serviceResult.scene.id,
                title: serviceResult.scene.title,
                sceneIndex: serviceResult.metadata.sceneIndex,
                globalSceneIndex: serviceResult.metadata.globalSceneIndex,
                totalScenesInChapter:
                    serviceResult.metadata.totalScenesInChapter,
                totalScenesInStory: serviceResult.metadata.totalScenesInStory,
                generationTime: serviceResult.metadata.generationTime,
            },
        );

        // 5. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[SCENE-SUMMARY API] ✅ Cache invalidated");

        console.log("✅ [SCENE-SUMMARY API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 6. Return typed response
        const response: GenerateSceneSummaryResponse = {
            success: true,
            scene: serviceResult.scene,
            metadata: {
                generationTime: serviceResult.metadata.generationTime,
                sceneIndex: serviceResult.metadata.sceneIndex,
                globalSceneIndex: serviceResult.metadata.globalSceneIndex,
                totalScenesInChapter:
                    serviceResult.metadata.totalScenesInChapter,
                totalScenesInStory: serviceResult.metadata.totalScenesInStory,
            },
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [SCENE-SUMMARY API] Error:", error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        if (error instanceof z.ZodError) {
            const errorResponse: GenerateSceneSummaryErrorResponse = {
                error: "Invalid input",
                details: error.issues,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        const errorResponse: GenerateSceneSummaryErrorResponse = {
            error: "Failed to generate and save scene summary",
            details: error instanceof Error ? error.message : "Unknown error",
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}

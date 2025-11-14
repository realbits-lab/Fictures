import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireScopes, withAuthentication } from "@/lib/auth/middleware";
import { getAuth } from "@/lib/auth/server-context";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import type {
    ApiSceneSummaryErrorResponse,
    ApiSceneSummaryRequest,
    ApiSceneSummaryResponse,
} from "@/lib/schemas/api/studio";
import { sceneSummaryService } from "@/lib/studio/services/scene-summary-service";

export const runtime = "nodejs";

const generateSceneSummarySchema = z.object({
    storyId: z.string().min(1, "storyId is required"),
    chapterId: z.string().min(1, "chapterId is required"),
});

/**
 * POST /api/studio/scene-summary - Generate ONE next scene summary (Extreme Incremental)
 *
 * Generates the next scene summary in sequence with full context of all previous scenes.
 * This is the extreme incremental approach where scene summaries are generated one at a time.
 */
export const POST = requireScopes("stories:write")(
    withAuthentication(async (request: NextRequest) => {
        try {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log(
                "📄 [SCENE-SUMMARY API] POST request received (Singular)",
            );
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            // 1. Get authentication from context
            const auth = getAuth();

            console.log("✅ [SCENE-SUMMARY API] Authentication successful:", {
                type: auth.type,
                userId: auth.userId,
                email: auth.email,
            });

            // 3. Parse and validate request body with type safety
            const body: ApiSceneSummaryRequest =
                (await request.json()) as ApiSceneSummaryRequest;
            const validatedData: z.infer<typeof generateSceneSummarySchema> =
                generateSceneSummarySchema.parse(body);

            console.log("[SCENE-SUMMARY API] Request parameters:", {
                storyId: validatedData.storyId,
                chapterId: validatedData.chapterId,
            });

            // 2. Generate using service (handles fetch, validation, generation, persistence)
            // API key is automatically retrieved from context
            console.log(
                "[SCENE-SUMMARY API] 🤖 Calling scene summary service (singular)...",
            );
            const serviceResult = await sceneSummaryService.generateAndSave({
                storyId: validatedData.storyId,
                chapterId: validatedData.chapterId,
                userId: auth.userId!,
            });

            console.log(
                "[SCENE-SUMMARY API] ✅ Scene summary generation and save completed:",
                {
                    sceneId: serviceResult.scene.id,
                    title: serviceResult.scene.title,
                    sceneIndex: serviceResult.metadata.sceneIndex,
                    totalScenes: serviceResult.metadata.totalScenes,
                    generationTime: serviceResult.metadata.generationTime,
                },
            );

            // 3. Invalidate cache
            await invalidateStudioCache(auth.userId!);
            console.log("[SCENE-SUMMARY API] ✅ Cache invalidated");

            console.log(
                "✅ [SCENE-SUMMARY API] Request completed successfully",
            );
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            // 4. Return typed response
            const response: ApiSceneSummaryResponse = {
                success: true,
                scene: serviceResult.scene,
                metadata: {
                    generationTime: serviceResult.metadata.generationTime,
                    sceneIndex: serviceResult.metadata.sceneIndex,
                    totalScenes: serviceResult.metadata.totalScenes,
                },
            };

            return NextResponse.json(response, { status: 201 });
        } catch (error) {
            console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.error("❌ [SCENE-SUMMARY API] Error:", error);
            console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            if (error instanceof z.ZodError) {
                const errorResponse: ApiSceneSummaryErrorResponse = {
                    error: "Invalid input",
                    details: error.issues,
                };
                return NextResponse.json(errorResponse, { status: 400 });
            }

            const errorResponse: ApiSceneSummaryErrorResponse = {
                error: "Failed to generate and save scene summary",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            };

            return NextResponse.json(errorResponse, { status: 500 });
        }
    }),
);

/**
 * Scene Improvement API Route
 *
 * POST /api/studio/scene-improvement - Improve scene quality using AI
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireScopes, withAuthentication } from "@/lib/auth/middleware";
import { getAuth } from "@/lib/auth/server-context";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import type {
    ApiSceneImprovementErrorResponse,
    ApiSceneImprovementRequest,
    ApiSceneImprovementResponse,
} from "@/lib/schemas/api/studio";
import { improveSceneSchema } from "@/lib/schemas/api/studio";
import type { Scene } from "@/lib/schemas/zod/generated";
import { sceneImprovementService } from "@/lib/studio/services";

export const runtime = "nodejs";

/**
 * POST /api/studio/scene-improvement
 *
 * Improve scene quality using AI
 *
 * Required scope: stories:write
 */
export const POST = requireScopes("stories:write")(
    withAuthentication(async (request: NextRequest) => {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📚 [SCENE IMPROVEMENT API] POST request received");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        try {
            // 1. Get auth from context
            const auth = getAuth();

            console.log(
                "✅ [SCENE IMPROVEMENT API] Authentication successful:",
                {
                    type: auth.type,
                    userId: auth.userId,
                    email: auth.email,
                },
            );

            // 2. Parse and validate request body
            const body: ApiSceneImprovementRequest =
                (await request.json()) as ApiSceneImprovementRequest;
            const validatedData: z.infer<typeof improveSceneSchema> =
                improveSceneSchema.parse(body);

            console.log("[SCENE IMPROVEMENT API] Request parameters:", {
                sceneId: validatedData.sceneId,
                maxIterations: validatedData.maxIterations,
            });

            // 3. Improve scene using service (handles fetch, validation, generation, persistence)
            console.log(
                "[SCENE IMPROVEMENT API] 🤖 Calling scene improvement service...",
            );

            const serviceResult = await sceneImprovementService.improveAndSave({
                sceneId: validatedData.sceneId,
                userId: auth.userId!, // Service will verify ownership
                maxIterations: validatedData.maxIterations,
            });

            console.log(
                "[SCENE IMPROVEMENT API] ✅ Scene improvement completed:",
                {
                    finalScore: serviceResult.improvement.score,
                    iterations: serviceResult.improvement.iterations,
                    improved: serviceResult.improvement.improved,
                    generationTime: serviceResult.metadata.generationTime,
                },
            );

            // 4. Invalidate cache
            await invalidateStudioCache(auth.userId!);
            console.log("[SCENE IMPROVEMENT API] ✅ Cache invalidated");

            console.log(
                "✅ [SCENE IMPROVEMENT API] Request completed successfully",
            );
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            // 5. Return typed response
            const response: ApiSceneImprovementResponse = {
                success: true,
                scene: serviceResult.scene as Scene,
                improvement: {
                    score: serviceResult.improvement.score,
                    categories: serviceResult.improvement.categories,
                    feedback: serviceResult.improvement.feedback,
                    iterations: serviceResult.improvement.iterations,
                    improved: serviceResult.improvement.improved,
                },
                metadata: {
                    generationTime: serviceResult.metadata.generationTime,
                },
            };

            return NextResponse.json(response, { status: 200 });
        } catch (error) {
            console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.error("❌ [SCENE IMPROVEMENT API] Error:", error);
            console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            if (error instanceof z.ZodError) {
                const errorResponse: ApiSceneImprovementErrorResponse = {
                    error: "Invalid input",
                    details: error.issues,
                };
                return NextResponse.json(errorResponse, { status: 400 });
            }

            const errorResponse: ApiSceneImprovementErrorResponse = {
                error: "Failed to improve scene",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            };

            return NextResponse.json(errorResponse, { status: 500 });
        }
    }),
);

/**
 * Scene Evaluation API Route
 *
 * POST /api/studio/scene-evaluation - Evaluate and improve scene quality using AI
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import type { Scene } from "@/lib/studio/generators/zod-schemas.generated";
import { sceneEvaluationService } from "@/lib/studio/services";
import type {
    ApiSceneEvaluationErrorResponse,
    ApiSceneEvaluationRequest,
    ApiSceneEvaluationResponse,
} from "../types";
import { evaluateSceneSchema } from "../validation-schemas";

export const runtime = "nodejs";

/**
 * POST /api/studio/scene-evaluation
 *
 * Evaluate and improve scene quality using AI
 *
 * Required scope: stories:write
 */
export async function POST(request: NextRequest) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📚 [SCENE EVALUATION API] POST request received");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
        // 1. Authenticate the request
        const authResult = await authenticateRequest(request);

        if (!authResult) {
            console.error("❌ [SCENE EVALUATION API] Authentication failed");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 2. Check if user has permission to write stories
        if (!hasRequiredScope(authResult, "stories:write")) {
            console.error("❌ [SCENE EVALUATION API] Insufficient scopes:", {
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

        console.log("✅ [SCENE EVALUATION API] Authentication successful:", {
            type: authResult.type,
            userId: authResult.user.id,
            email: authResult.user.email,
        });

        // 3. Parse and validate request body
        const body: ApiSceneEvaluationRequest =
            (await request.json()) as ApiSceneEvaluationRequest;
        const validatedData: z.infer<typeof evaluateSceneSchema> =
            evaluateSceneSchema.parse(body);

        console.log("[SCENE EVALUATION API] Request parameters:", {
            sceneId: validatedData.sceneId,
            maxIterations: validatedData.maxIterations,
        });

        // 4. Extract API key from request header (for AI server authentication)
        const apiKey: string | null = request.headers.get("x-api-key");
        console.log("[SCENE EVALUATION API] API key provided:", !!apiKey);

        // 5. Evaluate scene using service (handles fetch, validation, generation, persistence)
        console.log(
            "[SCENE EVALUATION API] 🤖 Calling scene evaluation service...",
        );

        const serviceResult = await sceneEvaluationService.evaluateAndSave({
            sceneId: validatedData.sceneId,
            userId: authResult.user.id, // Service will verify ownership
            maxIterations: validatedData.maxIterations,
            apiKey: apiKey || undefined,
        });

        console.log("[SCENE EVALUATION API] ✅ Scene evaluation completed:", {
            finalScore: serviceResult.evaluation.score,
            iterations: serviceResult.evaluation.iterations,
            improved: serviceResult.evaluation.improved,
            generationTime: serviceResult.metadata.generationTime,
        });

        // 5. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[SCENE EVALUATION API] ✅ Cache invalidated");

        console.log("✅ [SCENE EVALUATION API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 6. Return typed response
        const response: ApiSceneEvaluationResponse = {
            success: true,
            scene: serviceResult.scene as Scene,
            evaluation: {
                score: serviceResult.evaluation.score,
                categories: serviceResult.evaluation.categories,
                feedback: serviceResult.evaluation.feedback,
                iterations: serviceResult.evaluation.iterations,
                improved: serviceResult.evaluation.improved,
            },
            metadata: {
                generationTime: serviceResult.metadata.generationTime,
            },
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [SCENE EVALUATION API] Error:", error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        if (error instanceof z.ZodError) {
            const errorResponse: ApiSceneEvaluationErrorResponse = {
                error: "Invalid input",
                details: error.issues,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        const errorResponse: ApiSceneEvaluationErrorResponse = {
            error: "Failed to evaluate scene",
            details: error instanceof Error ? error.message : "Unknown error",
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}

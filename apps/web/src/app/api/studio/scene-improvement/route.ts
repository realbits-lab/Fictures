/**
 * Scene Improvement API Route
 *
 * POST /api/studio/scene-improvement - Improve scene quality using AI
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import type { Scene } from "@/lib/studio/generators/zod-schemas";
import { sceneImprovementService } from "@/lib/studio/services";
import type {
    ApiSceneImprovementErrorResponse,
    ApiSceneImprovementRequest,
    ApiSceneImprovementResponse,
} from "../types";
import { improveSceneSchema } from "../validation-schemas";

export const runtime = "nodejs";

/**
 * POST /api/studio/scene-improvement
 *
 * Improve scene quality using AI
 *
 * Required scope: stories:write
 */
export async function POST(request: NextRequest) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📚 [SCENE IMPROVEMENT API] POST request received");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
        // 1. Authenticate the request
        const authResult = await authenticateRequest(request);

        if (!authResult) {
            console.error("❌ [SCENE IMPROVEMENT API] Authentication failed");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 2. Check if user has permission to write stories
        if (!hasRequiredScope(authResult, "stories:write")) {
            console.error("❌ [SCENE IMPROVEMENT API] Insufficient scopes:", {
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

        console.log("✅ [SCENE IMPROVEMENT API] Authentication successful:", {
            type: authResult.type,
            userId: authResult.user.id,
            email: authResult.user.email,
        });

        // 3. Parse and validate request body
        const body: ApiSceneImprovementRequest =
            (await request.json()) as ApiSceneImprovementRequest;
        const validatedData: z.infer<typeof improveSceneSchema> =
            improveSceneSchema.parse(body);

        console.log("[SCENE IMPROVEMENT API] Request parameters:", {
            sceneId: validatedData.sceneId,
            maxIterations: validatedData.maxIterations,
        });

        // 4. Extract API key from request header (for AI server authentication)
        const apiKey: string | null = request.headers.get("x-api-key");
        console.log("[SCENE IMPROVEMENT API] API key provided:", !!apiKey);

        // 5. Improve scene using service (handles fetch, validation, generation, persistence)
        console.log(
            "[SCENE IMPROVEMENT API] 🤖 Calling scene improvement service...",
        );

        const serviceResult = await sceneImprovementService.improveAndSave({
            sceneId: validatedData.sceneId,
            userId: authResult.user.id, // Service will verify ownership
            maxIterations: validatedData.maxIterations,
            apiKey: apiKey || undefined,
        });

        console.log("[SCENE IMPROVEMENT API] ✅ Scene improvement completed:", {
            finalScore: serviceResult.improvement.score,
            iterations: serviceResult.improvement.iterations,
            improved: serviceResult.improvement.improved,
            generationTime: serviceResult.metadata.generationTime,
        });

        // 5. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[SCENE IMPROVEMENT API] ✅ Cache invalidated");

        console.log(
            "✅ [SCENE IMPROVEMENT API] Request completed successfully",
        );
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 6. Return typed response
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
            details: error instanceof Error ? error.message : "Unknown error",
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}

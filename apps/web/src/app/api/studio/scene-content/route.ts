/**
 * Scene Content API Route
 *
 * POST /api/studio/scene-content - Generate scene content using AI
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { sceneContentService } from "@/lib/studio/services";
import type {
    ApiSceneContentErrorResponse,
    ApiSceneContentRequest,
    ApiSceneContentResponse,
} from "../types";
import { generateSceneContentSchema } from "../types";

export const runtime = "nodejs";

/**
 * POST /api/studio/scene-content
 *
 * Generate scene content for a scene using AI
 *
 * Required scope: stories:write
 */
export async function POST(request: NextRequest) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📚 [SCENE-CONTENT API] POST request received");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
        // 1. Authenticate the request
        const authResult = await authenticateRequest(request);

        if (!authResult) {
            console.error("❌ [SCENE-CONTENT API] Authentication failed");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 2. Check if user has permission to write stories
        if (!hasRequiredScope(authResult, "stories:write")) {
            console.error("❌ [SCENE-CONTENT API] Insufficient scopes:", {
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

        console.log("✅ [SCENE-CONTENT API] Authentication successful:", {
            type: authResult.type,
            userId: authResult.user.id,
            email: authResult.user.email,
        });

        // 3. Parse and validate request body
        const body: ApiSceneContentRequest =
            (await request.json()) as ApiSceneContentRequest;
        const validatedData: z.infer<typeof generateSceneContentSchema> =
            generateSceneContentSchema.parse(body);

        console.log("[SCENE-CONTENT API] Request parameters:", {
            sceneId: validatedData.sceneId,
            language: validatedData.language,
        });

        // 4. Extract API key from request header (for AI server authentication)
        const apiKey: string | null = request.headers.get("x-api-key");
        console.log("[SCENE-CONTENT API] API key provided:", !!apiKey);

        // 5. Generate using service (handles fetch, validation, generation, persistence)
        console.log("[SCENE-CONTENT API] 🤖 Calling scene content service...");
        const serviceResult = await sceneContentService.generateAndSave({
            sceneId: validatedData.sceneId,
            language: validatedData.language,
            userId: authResult.user.id,
            apiKey: apiKey || undefined,
        });

        console.log(
            "[SCENE-CONTENT API] ✅ Scene content generation and save completed:",
            {
                wordCount: serviceResult.metadata.wordCount,
                generationTime: serviceResult.metadata.generationTime,
            },
        );

        // 5. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[SCENE-CONTENT API] ✅ Cache invalidated");

        console.log("✅ [SCENE-CONTENT API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 6. Return typed response
        const response: ApiSceneContentResponse = {
            success: true,
            scene: serviceResult.scene,
            metadata: {
                wordCount: serviceResult.metadata.wordCount,
                generationTime: serviceResult.metadata.generationTime,
            },
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [SCENE-CONTENT API] Error:", error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        if (error instanceof z.ZodError) {
            const errorResponse: ApiSceneContentErrorResponse = {
                error: "Invalid input",
                details: error.issues,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        const errorResponse: ApiSceneContentErrorResponse = {
            error: "Failed to generate and save scene content",
            details: error instanceof Error ? error.message : "Unknown error",
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}

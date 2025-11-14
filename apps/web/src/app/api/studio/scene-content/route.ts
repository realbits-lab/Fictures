/**
 * Scene Content API Route
 *
 * POST /api/studio/scene-content - Generate scene content using AI
 *
 * Authentication: Middleware-based auth with stories:write scope required
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireScopes, withAuthentication } from "@/lib/auth/middleware";
import { getAuth } from "@/lib/auth/server-context";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import type {
    ApiSceneContentErrorResponse,
    ApiSceneContentRequest,
    ApiSceneContentResponse,
} from "@/lib/schemas/api/studio";
import { generateSceneContentSchema } from "@/lib/schemas/api/studio";
import { sceneContentService } from "@/lib/studio/services";

export const runtime = "nodejs";

/**
 * POST /api/studio/scene-content
 *
 * Generate scene content for a scene using AI
 *
 * Required scope: stories:write
 */
export const POST = requireScopes("stories:write")(
    withAuthentication(async (request: NextRequest) => {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📚 [SCENE-CONTENT API] POST request received");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        try {
            const auth = getAuth();

            console.log("✅ [SCENE-CONTENT API] Authentication successful:", {
                type: auth.type,
                userId: auth.userId,
                email: auth.email,
            });

            // Parse and validate request body
            const body: ApiSceneContentRequest =
                (await request.json()) as ApiSceneContentRequest;
            const validatedData: z.infer<typeof generateSceneContentSchema> =
                generateSceneContentSchema.parse(body);

            console.log("[SCENE-CONTENT API] Request parameters:", {
                sceneId: validatedData.sceneId,
                language: validatedData.language,
            });

            // Generate using service (handles fetch, validation, generation, persistence)
            console.log(
                "[SCENE-CONTENT API] 🤖 Calling scene content service...",
            );
            const serviceResult = await sceneContentService.generateAndSave({
                sceneId: validatedData.sceneId,
                language: validatedData.language,
                userId: auth.userId!,
            });

            console.log(
                "[SCENE-CONTENT API] ✅ Scene content generation and save completed:",
                {
                    wordCount: serviceResult.metadata.wordCount,
                    generationTime: serviceResult.metadata.generationTime,
                },
            );

            // Invalidate cache
            await invalidateStudioCache(auth.userId!);
            console.log("[SCENE-CONTENT API] ✅ Cache invalidated");

            console.log(
                "✅ [SCENE-CONTENT API] Request completed successfully",
            );
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            // Return typed response
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
                details:
                    error instanceof Error ? error.message : "Unknown error",
            };

            return NextResponse.json(errorResponse, { status: 500 });
        }
    }),
);

/**
 * Scene Evaluation API Route
 *
 * POST /studio/api/scene-evaluation - Evaluate and improve scene quality using AI
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
import { evaluateScene } from "@/lib/studio/generators/scene-evaluation-generator";
import type {
    EvaluateSceneParams,
    EvaluateSceneResult,
} from "@/lib/studio/generators/types";
import type {
    Chapter,
    Scene,
    Story,
} from "@/lib/studio/generators/zod-schemas.generated";
import type {
    EvaluateSceneErrorResponse,
    EvaluateSceneRequest,
    EvaluateSceneResponse,
} from "../types";
import { evaluateSceneSchema } from "../validation-schemas";

export const runtime = "nodejs";

/**
 * POST /studio/api/scene-evaluation
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
        const body: EvaluateSceneRequest =
            (await request.json()) as EvaluateSceneRequest;
        const validatedData: z.infer<typeof evaluateSceneSchema> =
            evaluateSceneSchema.parse(body);

        console.log("[SCENE EVALUATION API] Request parameters:", {
            sceneId: validatedData.sceneId,
            maxIterations: validatedData.maxIterations,
        });

        // 4. Fetch scene and verify ownership
        const sceneResults = await db
            .select()
            .from(scenes)
            .where(eq(scenes.id, validatedData.sceneId));

        const scene: Scene | undefined = sceneResults[0] as Scene | undefined;

        if (!scene) {
            console.error("❌ [SCENE EVALUATION API] Scene not found");
            return NextResponse.json(
                { error: "Scene not found" },
                { status: 404 },
            );
        }

        // 5. Verify scene has content
        if (!scene.content || scene.content.trim() === "") {
            console.error("❌ [SCENE EVALUATION API] Scene has no content");
            return NextResponse.json(
                { error: "Scene must have content before evaluation" },
                { status: 400 },
            );
        }

        // 6. Get chapter to get story ID
        const chapterResults = await db
            .select()
            .from(chapters)
            .where(eq(chapters.id, scene.chapterId));

        const chapter: Chapter | undefined = chapterResults[0] as
            | Chapter
            | undefined;

        if (!chapter) {
            console.error("❌ [SCENE EVALUATION API] Chapter not found");
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 },
            );
        }

        // 7. Get story to verify ownership
        const storyResults = await db
            .select()
            .from(stories)
            .where(eq(stories.id, chapter.storyId));

        const story: Story | undefined = storyResults[0] as Story | undefined;

        if (!story) {
            console.error("❌ [SCENE EVALUATION API] Story not found");
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        // 8. Verify user is story author
        if (story.authorId !== authResult.user.id) {
            console.error(
                "❌ [SCENE EVALUATION API] Access denied - not story author",
            );
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 },
            );
        }

        console.log("✅ [SCENE EVALUATION API] Scene verified:", {
            id: scene.id,
            title: scene.title,
        });

        // 9. Evaluate scene using AI
        console.log("[SCENE EVALUATION API] 🤖 Calling scene evaluator...");
        const evaluateParams: EvaluateSceneParams = {
            content: scene.content,
            story: story,
            maxIterations: validatedData.maxIterations,
        };

        const evaluationResult: EvaluateSceneResult =
            await evaluateScene(evaluateParams);

        console.log("[SCENE EVALUATION API] ✅ Scene evaluation completed:", {
            finalScore: evaluationResult.score,
            iterations: evaluationResult.iterations,
            improved: evaluationResult.improved,
            generationTime: evaluationResult.metadata.generationTime,
        });

        // 10. Check if score meets quality threshold before updating
        const QUALITY_THRESHOLD: number = 3.0; // Minimum "Effective" level (3.0/4.0)
        const meetsThreshold: boolean =
            evaluationResult.score >= QUALITY_THRESHOLD;

        console.log(
            `[SCENE EVALUATION API] Quality check: ${evaluationResult.score}/4.0 (threshold: ${QUALITY_THRESHOLD}/4.0) - ${meetsThreshold ? "PASS ✅" : "FAIL ❌"}`,
        );

        let updatedScene: Scene;

        if (meetsThreshold || evaluationResult.improved) {
            // 11. Update scene with improved content if threshold met or content improved
            console.log(
                "[SCENE EVALUATION API] 💾 Saving evaluation results...",
            );
            const now: string = new Date().toISOString();

            const updatedSceneResults: Scene[] = (await db
                .update(scenes)
                .set({
                    content: evaluationResult.finalContent,
                    updatedAt: now,
                })
                .where(eq(scenes.id, validatedData.sceneId))
                .returning()) as Scene[];

            updatedScene = updatedSceneResults[0];
            console.log(
                "[SCENE EVALUATION API] ✅ Evaluation results saved (content updated)",
            );
        } else {
            // 12. Keep original content if threshold not met and no improvement
            console.log(
                "[SCENE EVALUATION API] ⚠️ Quality threshold not met - keeping original content",
            );
            updatedScene = scene;
        }

        // 13. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[SCENE EVALUATION API] ✅ Cache invalidated");

        console.log("✅ [SCENE EVALUATION API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 14. Return typed response
        const response: EvaluateSceneResponse = {
            success: true,
            scene: updatedScene,
            evaluation: {
                score: evaluationResult.score,
                categories: evaluationResult.categories,
                feedback: evaluationResult.feedback,
                iterations: evaluationResult.iterations,
                improved: evaluationResult.improved,
            },
            metadata: {
                generationTime: evaluationResult.metadata.generationTime,
            },
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [SCENE EVALUATION API] Error:", error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        if (error instanceof z.ZodError) {
            const errorResponse: EvaluateSceneErrorResponse = {
                error: "Invalid input",
                details: error.issues,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        const errorResponse: EvaluateSceneErrorResponse = {
            error: "Failed to evaluate scene",
            details: error instanceof Error ? error.message : "Unknown error",
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}

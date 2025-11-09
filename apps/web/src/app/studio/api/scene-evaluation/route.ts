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
import { scenes, stories } from "@/lib/db/schema";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { evaluateScene } from "@/lib/studio/generators/scene-evaluation-generator";
import type { EvaluateSceneParams } from "@/lib/studio/generators/types";

export const runtime = "nodejs";

/**
 * Validation schema for evaluating scene quality
 */
const evaluateSceneSchema = z.object({
	sceneId: z.string(),
	maxIterations: z.number().min(1).max(3).optional().default(2),
});

/**
 * POST /studio/api/scene-evaluation
 *
 * Evaluate and improve scene quality using AI
 *
 * Required scope: stories:write
 */
export async function POST(request: NextRequest) {
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("📚 [SCENE-EVALUATION API] POST request received");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	try {
		const authResult = await authenticateRequest(request);

		if (!authResult) {
			console.error("❌ [SCENE-EVALUATION API] Authentication failed");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (!hasRequiredScope(authResult, "stories:write")) {
			console.error("❌ [SCENE-EVALUATION API] Insufficient scopes:", {
				required: "stories:write",
				actual: authResult.scopes,
			});
			return NextResponse.json(
				{ error: "Insufficient permissions. Required scope: stories:write" },
				{ status: 403 },
			);
		}

		console.log("✅ [SCENE-EVALUATION API] Authentication successful:", {
			type: authResult.type,
			userId: authResult.user.id,
			email: authResult.user.email,
		});

		// Parse and validate request body
		const body = await request.json();
		const validatedData = evaluateSceneSchema.parse(body);

		console.log("[SCENE-EVALUATION API] Request parameters:", {
			sceneId: validatedData.sceneId,
			maxIterations: validatedData.maxIterations,
		});

		// Fetch scene and verify ownership
		const [scene] = await db
			.select()
			.from(scenes)
			.where(eq(scenes.id, validatedData.sceneId));

		if (!scene) {
			console.error("❌ [SCENE-EVALUATION API] Scene not found");
			return NextResponse.json({ error: "Scene not found" }, { status: 404 });
		}

		if (!scene.content || scene.content.trim() === "") {
			console.error("❌ [SCENE-EVALUATION API] Scene has no content");
			return NextResponse.json(
				{ error: "Scene must have content before evaluation" },
				{ status: 400 },
			);
		}

		// Get story to verify ownership
		const [story] = await db
			.select()
			.from(stories)
			.where(eq(stories.id, scene.storyId));

		if (!story) {
			console.error("❌ [SCENE-EVALUATION API] Story not found");
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		if (story.authorId !== authResult.user.id) {
			console.error(
				"❌ [SCENE-EVALUATION API] Access denied - not story author",
			);
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		console.log("✅ [SCENE-EVALUATION API] Scene verified:", {
			id: scene.id,
			title: scene.title,
		});

		// Evaluate scene using AI
		console.log("[SCENE-EVALUATION API] 🤖 Calling scene evaluator...");
		const evaluateParams: EvaluateSceneParams = {
			content: scene.content,
			story: story as any,
			maxIterations: validatedData.maxIterations,
		};

		const evaluationResult = await evaluateScene(evaluateParams);

		console.log("[SCENE-EVALUATION API] ✅ Scene evaluation completed:", {
			finalScore: evaluationResult.score,
			iterations: evaluationResult.iterations,
			improved: evaluationResult.improved,
			generationTime: evaluationResult.metadata.generationTime,
		});

		// Update scene with improved content and evaluation
		console.log("[SCENE-EVALUATION API] 💾 Saving evaluation results...");
		const [updatedScene] = await db
			.update(scenes)
			.set({
				content: evaluationResult.finalContent,
				qualityScore: evaluationResult.score,
				updatedAt: new Date(),
			})
			.where(eq(scenes.id, validatedData.sceneId))
			.returning();

		console.log("[SCENE-EVALUATION API] ✅ Evaluation results saved");

		// Invalidate cache
		await invalidateStudioCache(authResult.user.id);
		console.log("[SCENE-EVALUATION API] ✅ Cache invalidated");

		console.log("✅ [SCENE-EVALUATION API] Request completed successfully");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		return NextResponse.json(
			{
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
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.error("❌ [SCENE-EVALUATION API] Error:", error);
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid input", details: error.issues },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{
				error: "Failed to evaluate scene",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

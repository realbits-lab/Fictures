import { type NextRequest, NextResponse } from "next/server";
import { evaluateScene } from "@/lib/studio/generators";

interface SceneContext {
	title?: string;
	cyclePhase?: string;
	emotionalBeat?: string;
	genre?: string;
}

export async function POST(request: NextRequest) {
	try {
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("⭐ [SCENE EVALUATION API] Request received");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

		const body = (await request.json()) as {
			sceneContent: string;
			sceneContext?: SceneContext;
		};

		const { sceneContent, sceneContext = {} } = body;

		console.log("[SCENE EVALUATION API] Request parameters:", {
			contentLength: sceneContent?.length || 0,
			wordCount: sceneContent ? sceneContent.split(/\s+/).length : 0,
			sceneTitle: sceneContext.title,
			cyclePhase: sceneContext.cyclePhase,
		});

		if (!sceneContent || sceneContent.trim().length < 100) {
			console.error(
				"❌ [SCENE EVALUATION API] Validation failed: content too short",
			);
			return NextResponse.json(
				{ error: "Valid scene content is required (minimum 100 characters)" },
				{ status: 400 },
			);
		}

		console.log("✅ [SCENE EVALUATION API] Validation passed");
		console.log(
			"[SCENE EVALUATION API] 🤖 Calling scene evaluation generator...",
		);

		// Create a minimal story object for evaluation context
		const storyContext = {
			id: "temp_story_id",
			userId: "temp_user_id",
			title: "Story Title",
			genre: sceneContext.genre || "Drama",
			tone: "Engaging",
			summary: "",
			moralFramework: "Virtue through adversity",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Use the common generator (does NOT save to database)
		const generationResult = await evaluateScene({
			sceneId: "temp_scene_id",
			content: sceneContent,
			story: storyContext,
			maxIterations: 2, // Allow up to 2 improvement iterations
		});

		console.log("[SCENE EVALUATION API] ✅ Scene evaluation completed");
		console.log("[SCENE EVALUATION API] Result summary:", {
			score: generationResult.score,
			improved: generationResult.improved,
			iterations: generationResult.iterations,
			categories: generationResult.categories,
		});
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		// Return in the expected format (matches old API contract)
		return NextResponse.json({
			iteration: generationResult.iterations,
			scores: generationResult.categories,
			overallScore: generationResult.score,
			feedback: {
				strengths: [],
				improvements: [generationResult.feedback],
				priorityFixes: [],
			},
		});
	} catch (error) {
		console.error("Scene evaluation error:", error);
		return NextResponse.json(
			{
				error: "Failed to evaluate scene",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

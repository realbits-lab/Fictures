/**
 * Scenes API Route
 *
 * POST /studio/api/scenes - Generate scene summaries using AI
 * GET /studio/api/scenes - Get scenes for a chapter
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required for POST
 */

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { RelationshipManager } from "@/lib/db/relationships";
import { chapters, scenes, settings, stories } from "@/lib/db/schema";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { generateSceneSummaries } from "@/lib/studio/generators/scene-summaries-generator";
import type { GenerateSceneSummariesParams } from "@/lib/studio/generators/types";
import type {
	GenerateSceneSummariesErrorResponse,
	GenerateSceneSummariesRequest,
	GenerateSceneSummariesResponse,
} from "../types";

export const runtime = "nodejs";

/**
 * Validation schema for generating scene summaries
 */
const generateScenesSchema = z.object({
	storyId: z.string(),
	scenesPerChapter: z.number().min(1).max(10).optional().default(3),
	language: z.string().optional().default("English"),
});

// GET /api/scenes - Get scenes for a chapter
export async function GET(request: NextRequest) {
	try {
		const authResult = await authenticateRequest(request);

		if (!authResult) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const chapterId = searchParams.get("chapterId");

		if (!chapterId) {
			return NextResponse.json(
				{ error: "chapterId parameter is required" },
				{ status: 400 },
			);
		}

		// Get chapter and check access
		const [chapter] = await db
			.select()
			.from(chapters)
			.where(eq(chapters.id, chapterId));
		if (!chapter) {
			return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
		}

		// Get story and check access permissions
		const [story] = await db
			.select()
			.from(stories)
			.where(eq(stories.id, chapter.storyId));
		if (!story) {
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		// Check access permissions - only allow author access for now
		if (story.authorId !== authResult.user.id) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		// Get scenes for the chapter
		const chapterScenes = await db
			.select()
			.from(scenes)
			.where(eq(scenes.chapterId, chapterId))
			.orderBy(scenes.orderIndex);

		return NextResponse.json({
			scenes: chapterScenes.map((scene) => ({
				...scene,
				chapter: {
					id: chapter.id,
					title: chapter.title,
					storyId: chapter.storyId,
				},
				story: {
					id: story.id,
					title: story.title,
					authorId: story.authorId,
				},
			})),
		});
	} catch (error) {
		console.error("Error fetching scenes:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

/**
 * POST /studio/api/scenes
 *
 * Generate scene summaries for a story using AI
 *
 * Required scope: stories:write
 */
export async function POST(request: NextRequest) {
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("📚 [SCENES API] POST request received");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	try {
		const authResult = await authenticateRequest(request);

		if (!authResult) {
			console.error("❌ [SCENES API] Authentication failed");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (!hasRequiredScope(authResult, "stories:write")) {
			console.error("❌ [SCENES API] Insufficient scopes:", {
				required: "stories:write",
				actual: authResult.scopes,
			});
			return NextResponse.json(
				{ error: "Insufficient permissions. Required scope: stories:write" },
				{ status: 403 },
			);
		}

		console.log("✅ [SCENES API] Authentication successful:", {
			type: authResult.type,
			userId: authResult.user.id,
			email: authResult.user.email,
		});

		// Parse and validate request body with type safety
		const body = (await request.json()) as GenerateSceneSummariesRequest;
		const validatedData = generateScenesSchema.parse(body);

		console.log("[SCENES API] Request parameters:", {
			storyId: validatedData.storyId,
			scenesPerChapter: validatedData.scenesPerChapter,
			language: validatedData.language,
		});

		// Fetch story and verify ownership
		const [story] = await db
			.select()
			.from(stories)
			.where(eq(stories.id, validatedData.storyId));

		if (!story) {
			console.error("❌ [SCENES API] Story not found");
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		if (story.authorId !== authResult.user.id) {
			console.error("❌ [SCENES API] Access denied - not story author");
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		console.log("✅ [SCENES API] Story verified:", {
			id: story.id,
			title: story.title,
		});

		// Fetch chapters for the story
		const storyChapters = await db
			.select()
			.from(chapters)
			.where(eq(chapters.storyId, validatedData.storyId))
			.orderBy(chapters.orderIndex);

		if (storyChapters.length === 0) {
			console.error("❌ [SCENES API] No chapters found for story");
			return NextResponse.json(
				{ error: "Story must have chapters before generating scenes" },
				{ status: 400 },
			);
		}

		console.log(`✅ [SCENES API] Found ${storyChapters.length} chapters`);

		// Fetch settings for the story
		const storySettings = await db
			.select()
			.from(settings)
			.where(eq(settings.storyId, validatedData.storyId));

		console.log(`[SCENES API] Found ${storySettings.length} settings`);

		// Generate scene summaries using AI
		console.log("[SCENES API] 🤖 Calling scene summaries generator...");
		const generateParams: GenerateSceneSummariesParams = {
			storyId: validatedData.storyId,
			chapters: storyChapters as any,
			settings: storySettings as any,
			scenesPerChapter: validatedData.scenesPerChapter,
		};

		const generationResult = await generateSceneSummaries(generateParams);

		console.log("[SCENES API] ✅ Scene summaries generation completed:", {
			count: generationResult.scenes.length,
			generationTime: generationResult.metadata.generationTime,
		});

		// Save generated scene summaries to database
		console.log("[SCENES API] 💾 Saving scene summaries to database...");
		const savedScenes = [];

		for (let i = 0; i < generationResult.scenes.length; i++) {
			const sceneData = generationResult.scenes[i];
			const sceneId = await RelationshipManager.addSceneToChapter(
				sceneData.chapterId,
				{
					title: sceneData.title || `Scene ${i + 1}`,
					summary: sceneData.summary || null,
					orderIndex: i + 1,
				},
			);

			const [savedScene] = await db
				.select()
				.from(scenes)
				.where(eq(scenes.id, sceneId))
				.limit(1);

			savedScenes.push(savedScene);
		}

		console.log(
			`[SCENES API] ✅ Saved ${savedScenes.length} scene summaries to database`,
		);

		// Invalidate cache
		await invalidateStudioCache(authResult.user.id);
		console.log("[SCENES API] ✅ Cache invalidated");

		console.log("✅ [SCENES API] Request completed successfully");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		// Return typed response
		const response: GenerateSceneSummariesResponse = {
			success: true,
			scenes: savedScenes,
			metadata: {
				totalGenerated: savedScenes.length,
				generationTime: generationResult.metadata.generationTime,
			},
		};

		return NextResponse.json(response, { status: 201 });
	} catch (error) {
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.error("❌ [SCENES API] Error:", error);
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		if (error instanceof z.ZodError) {
			const errorResponse: GenerateSceneSummariesErrorResponse = {
				error: "Invalid input",
				details: error.issues,
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		const errorResponse: GenerateSceneSummariesErrorResponse = {
			error: "Failed to generate and save scene summaries",
			details: error instanceof Error ? error.message : "Unknown error",
		};

		return NextResponse.json(errorResponse, { status: 500 });
	}
}

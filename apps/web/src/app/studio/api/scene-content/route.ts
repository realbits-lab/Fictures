/**
 * Scene Content API Route
 *
 * POST /studio/api/scene-content - Generate scene content using AI
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required
 */

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { characters, scenes, settings, stories } from "@/lib/db/schema";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { generateSceneContent } from "@/lib/studio/generators/scene-content-generator";
import type { GenerateSceneContentParams } from "@/lib/studio/generators/types";

export const runtime = "nodejs";

/**
 * Validation schema for generating scene content
 */
const generateSceneContentSchema = z.object({
	sceneId: z.string(),
	language: z.string().optional().default("English"),
});

/**
 * POST /studio/api/scene-content
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
		const authResult = await authenticateRequest(request);

		if (!authResult) {
			console.error("❌ [SCENE-CONTENT API] Authentication failed");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (!hasRequiredScope(authResult, "stories:write")) {
			console.error("❌ [SCENE-CONTENT API] Insufficient scopes:", {
				required: "stories:write",
				actual: authResult.scopes,
			});
			return NextResponse.json(
				{ error: "Insufficient permissions. Required scope: stories:write" },
				{ status: 403 },
			);
		}

		console.log("✅ [SCENE-CONTENT API] Authentication successful:", {
			type: authResult.type,
			userId: authResult.user.id,
			email: authResult.user.email,
		});

		// Parse and validate request body
		const body = await request.json();
		const validatedData = generateSceneContentSchema.parse(body);

		console.log("[SCENE-CONTENT API] Request parameters:", {
			sceneId: validatedData.sceneId,
			language: validatedData.language,
		});

		// Fetch scene and verify ownership
		const [scene] = await db
			.select()
			.from(scenes)
			.where(eq(scenes.id, validatedData.sceneId));

		if (!scene) {
			console.error("❌ [SCENE-CONTENT API] Scene not found");
			return NextResponse.json({ error: "Scene not found" }, { status: 404 });
		}

		// Get story to verify ownership
		const [story] = await db
			.select()
			.from(stories)
			.where(eq(stories.id, scene.storyId));

		if (!story) {
			console.error("❌ [SCENE-CONTENT API] Story not found");
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		if (story.authorId !== authResult.user.id) {
			console.error("❌ [SCENE-CONTENT API] Access denied - not story author");
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		console.log("✅ [SCENE-CONTENT API] Scene verified:", {
			id: scene.id,
			title: scene.title,
		});

		// Fetch characters for the story
		const storyCharacters = await db
			.select()
			.from(characters)
			.where(eq(characters.storyId, scene.storyId));

		console.log(
			`✅ [SCENE-CONTENT API] Found ${storyCharacters.length} characters`,
		);

		// Fetch settings for the story
		const storySettings = await db
			.select()
			.from(settings)
			.where(eq(settings.storyId, scene.storyId));

		console.log(`[SCENE-CONTENT API] Found ${storySettings.length} settings`);

		// Generate scene content using AI
		console.log("[SCENE-CONTENT API] 🤖 Calling scene content generator...");
		const generateParams: GenerateSceneContentParams = {
			sceneId: validatedData.sceneId,
			scene: scene as any,
			characters: storyCharacters as any,
			settings: storySettings as any,
			language: validatedData.language,
		};

		const generationResult = await generateSceneContent(generateParams);

		console.log("[SCENE-CONTENT API] ✅ Scene content generation completed:", {
			wordCount: generationResult.wordCount,
			generationTime: generationResult.metadata.generationTime,
		});

		// Update scene with generated content
		console.log("[SCENE-CONTENT API] 💾 Saving scene content to database...");
		const [updatedScene] = await db
			.update(scenes)
			.set({
				content: generationResult.content,
				updatedAt: new Date(),
			})
			.where(eq(scenes.id, validatedData.sceneId))
			.returning();

		console.log("[SCENE-CONTENT API] ✅ Scene content saved to database");

		// Invalidate cache
		await invalidateStudioCache(authResult.user.id);
		console.log("[SCENE-CONTENT API] ✅ Cache invalidated");

		console.log("✅ [SCENE-CONTENT API] Request completed successfully");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		return NextResponse.json(
			{
				success: true,
				scene: updatedScene,
				metadata: {
					wordCount: generationResult.wordCount,
					generationTime: generationResult.metadata.generationTime,
				},
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.error("❌ [SCENE-CONTENT API] Error:", error);
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid input", details: error.issues },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{
				error: "Failed to generate and save scene content",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

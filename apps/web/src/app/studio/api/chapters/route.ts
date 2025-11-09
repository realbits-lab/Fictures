/**
 * Chapters API Route
 *
 * POST /studio/api/chapters - Generate chapters using AI
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required
 */

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { RelationshipManager } from "@/lib/db/relationships";
import { chapters, characters, parts, stories } from "@/lib/db/schema";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { generateChapters } from "@/lib/studio/generators/chapters-generator";
import type { GenerateChaptersParams } from "@/lib/studio/generators/types";

export const runtime = "nodejs";

/**
 * Validation schema for generating chapters
 */
const generateChaptersSchema = z.object({
	storyId: z.string(),
	chaptersPerPart: z.number().min(1).max(10).optional().default(3),
	language: z.string().optional().default("English"),
});

/**
 * POST /studio/api/chapters
 *
 * Generate chapters for a story using AI
 *
 * Required scope: stories:write
 */
export async function POST(request: NextRequest) {
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("📚 [CHAPTERS API] POST request received");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	try {
		const authResult = await authenticateRequest(request);

		if (!authResult) {
			console.error("❌ [CHAPTERS API] Authentication failed");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (!hasRequiredScope(authResult, "stories:write")) {
			console.error("❌ [CHAPTERS API] Insufficient scopes:", {
				required: "stories:write",
				actual: authResult.scopes,
			});
			return NextResponse.json(
				{ error: "Insufficient permissions. Required scope: stories:write" },
				{ status: 403 },
			);
		}

		console.log("✅ [CHAPTERS API] Authentication successful:", {
			type: authResult.type,
			userId: authResult.user.id,
			email: authResult.user.email,
		});

		// Parse and validate request body
		const body = await request.json();
		const validatedData = generateChaptersSchema.parse(body);

		console.log("[CHAPTERS API] Request parameters:", {
			storyId: validatedData.storyId,
			chaptersPerPart: validatedData.chaptersPerPart,
			language: validatedData.language,
		});

		// Fetch story and verify ownership
		const [story] = await db
			.select()
			.from(stories)
			.where(eq(stories.id, validatedData.storyId));

		if (!story) {
			console.error("❌ [CHAPTERS API] Story not found");
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		if (story.authorId !== authResult.user.id) {
			console.error("❌ [CHAPTERS API] Access denied - not story author");
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		console.log("✅ [CHAPTERS API] Story verified:", {
			id: story.id,
			title: story.title,
		});

		// Fetch parts for the story
		const storyParts = await db
			.select()
			.from(parts)
			.where(eq(parts.storyId, validatedData.storyId))
			.orderBy(parts.orderIndex);

		if (storyParts.length === 0) {
			console.error("❌ [CHAPTERS API] No parts found for story");
			return NextResponse.json(
				{ error: "Story must have parts before generating chapters" },
				{ status: 400 },
			);
		}

		console.log(`✅ [CHAPTERS API] Found ${storyParts.length} parts`);

		// Fetch characters for the story
		const storyCharacters = await db
			.select()
			.from(characters)
			.where(eq(characters.storyId, validatedData.storyId));

		if (storyCharacters.length === 0) {
			console.error("❌ [CHAPTERS API] No characters found for story");
			return NextResponse.json(
				{ error: "Story must have characters before generating chapters" },
				{ status: 400 },
			);
		}

		console.log(`✅ [CHAPTERS API] Found ${storyCharacters.length} characters`);

		// Generate chapters using AI
		console.log("[CHAPTERS API] 🤖 Calling chapters generator...");
		const generateParams: GenerateChaptersParams = {
			storyId: validatedData.storyId,
			story: story as any,
			parts: storyParts as any,
			characters: storyCharacters as any,
			chaptersPerPart: validatedData.chaptersPerPart,
		};

		const generationResult = await generateChapters(generateParams);

		console.log("[CHAPTERS API] ✅ Chapters generation completed:", {
			count: generationResult.chapters.length,
			generationTime: generationResult.metadata.generationTime,
		});

		// Save generated chapters to database
		console.log("[CHAPTERS API] 💾 Saving chapters to database...");
		const savedChapters = [];

		for (let i = 0; i < generationResult.chapters.length; i++) {
			const chapterData = generationResult.chapters[i];
			const chapterId = await RelationshipManager.addChapterToPart(
				chapterData.partId,
				{
					title: chapterData.title || `Chapter ${i + 1}`,
					summary: chapterData.summary || null,
					orderIndex: i + 1,
				},
			);

			const [savedChapter] = await db
				.select()
				.from(chapters)
				.where(eq(chapters.id, chapterId))
				.limit(1);

			savedChapters.push(savedChapter);
		}

		console.log(
			`[CHAPTERS API] ✅ Saved ${savedChapters.length} chapters to database`,
		);

		// Invalidate cache
		await invalidateStudioCache(authResult.user.id);
		console.log("[CHAPTERS API] ✅ Cache invalidated");

		console.log("✅ [CHAPTERS API] Request completed successfully");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		return NextResponse.json(
			{
				success: true,
				chapters: savedChapters,
				metadata: {
					totalGenerated: savedChapters.length,
					generationTime: generationResult.metadata.generationTime,
				},
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.error("❌ [CHAPTERS API] Error:", error);
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid input", details: error.issues },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{
				error: "Failed to generate and save chapters",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

/**
 * Characters API Route
 *
 * POST /studio/api/characters - Generate characters using AI
 * GET /studio/api/characters - Get characters for a story
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required for POST
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { characters, stories } from "@/lib/db/schema";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { generateCharacters } from "@/lib/studio/generators/characters-generator";
import type { GenerateCharactersParams } from "@/lib/studio/generators/types";

export const runtime = "nodejs";

/**
 * Validation schema for generating characters
 */
const generateCharactersSchema = z.object({
	storyId: z.string(),
	characterCount: z.number().min(1).max(10).optional().default(3),
	language: z.string().optional().default("English"),
});

/**
 * GET /studio/api/characters
 *
 * Get all characters for a story
 */
export async function GET(request: NextRequest) {
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("📚 [CHARACTERS API] GET request received");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	try {
		const authResult = await authenticateRequest(request);

		if (!authResult) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const storyId = searchParams.get("storyId");

		if (!storyId) {
			return NextResponse.json(
				{ error: "storyId parameter is required" },
				{ status: 400 },
			);
		}

		// Verify story exists and user has access
		const [story] = await db
			.select()
			.from(stories)
			.where(eq(stories.id, storyId))
			.limit(1);

		if (!story) {
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		if (story.authorId !== authResult.user.id) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		// Get all characters for this story
		const storyCharacters = await db
			.select()
			.from(characters)
			.where(eq(characters.storyId, storyId))
			.orderBy(characters.createdAt);

		console.log(
			`✅ [CHARACTERS API] Found ${storyCharacters.length} characters`,
		);

		return NextResponse.json({
			success: true,
			characters: storyCharacters,
		});
	} catch (error) {
		console.error("❌ [CHARACTERS API] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

/**
 * POST /studio/api/characters
 *
 * Generate characters for a story using AI
 *
 * Required scope: stories:write
 */
export async function POST(request: NextRequest) {
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("📚 [CHARACTERS API] POST request received");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	try {
		const authResult = await authenticateRequest(request);

		if (!authResult) {
			console.error("❌ [CHARACTERS API] Authentication failed");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (!hasRequiredScope(authResult, "stories:write")) {
			console.error("❌ [CHARACTERS API] Insufficient scopes:", {
				required: "stories:write",
				actual: authResult.scopes,
			});
			return NextResponse.json(
				{ error: "Insufficient permissions. Required scope: stories:write" },
				{ status: 403 },
			);
		}

		console.log("✅ [CHARACTERS API] Authentication successful:", {
			type: authResult.type,
			userId: authResult.user.id,
			email: authResult.user.email,
		});

		// Parse and validate request body
		const body = await request.json();
		const validatedData = generateCharactersSchema.parse(body);

		console.log("[CHARACTERS API] Request parameters:", {
			storyId: validatedData.storyId,
			characterCount: validatedData.characterCount,
			language: validatedData.language,
		});

		// Fetch story and verify ownership
		const [story] = await db
			.select()
			.from(stories)
			.where(eq(stories.id, validatedData.storyId));

		if (!story) {
			console.error("❌ [CHARACTERS API] Story not found");
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		if (story.authorId !== authResult.user.id) {
			console.error("❌ [CHARACTERS API] Access denied - not story author");
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		console.log("✅ [CHARACTERS API] Story verified:", {
			id: story.id,
			title: story.title,
		});

		// Generate characters using AI
		console.log("[CHARACTERS API] 🤖 Calling characters generator...");
		const generateParams: GenerateCharactersParams = {
			storyId: validatedData.storyId,
			userId: authResult.user.id,
			story: story as any,
			characterCount: validatedData.characterCount,
			language: validatedData.language,
		};

		const generationResult = await generateCharacters(generateParams);

		console.log("[CHARACTERS API] ✅ Characters generation completed:", {
			count: generationResult.characters.length,
			generationTime: generationResult.metadata.generationTime,
		});

		// Save generated characters to database
		console.log("[CHARACTERS API] 💾 Saving characters to database...");
		const savedCharacters = [];

		for (const characterData of generationResult.characters) {
			const characterId = `char_${nanoid(16)}`;
			const [savedCharacter] = await db
				.insert(characters)
				.values({
					id: characterId,
					storyId: validatedData.storyId,
					name: characterData.name || "Unnamed Character",
					isMain: characterData.isMain || false,
					summary: characterData.summary || null,
					coreTrait: characterData.coreTrait || null,
					internalFlaw: characterData.internalFlaw || null,
					externalGoal: characterData.externalGoal || null,
					personality: characterData.personality || null,
					backstory: characterData.backstory || null,
					physicalDescription: characterData.physicalDescription || null,
					voiceStyle: characterData.voiceStyle || null,
					relationships: characterData.relationships || null,
					imageUrl: null,
					imageVariants: null,
					visualStyle: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			savedCharacters.push(savedCharacter);
		}

		console.log(
			`[CHARACTERS API] ✅ Saved ${savedCharacters.length} characters to database`,
		);

		// Invalidate cache
		await invalidateStudioCache(authResult.user.id);
		console.log("[CHARACTERS API] ✅ Cache invalidated");

		console.log("✅ [CHARACTERS API] Request completed successfully");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		return NextResponse.json(
			{
				success: true,
				characters: savedCharacters,
				metadata: {
					totalGenerated: savedCharacters.length,
					generationTime: generationResult.metadata.generationTime,
				},
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.error("❌ [CHARACTERS API] Error:", error);
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid input", details: error.issues },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{
				error: "Failed to generate and save characters",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

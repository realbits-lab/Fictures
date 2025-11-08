import { type NextRequest, NextResponse } from "next/server";
import { generateParts } from "@/lib/studio/generators";
import type { StorySummaryResult } from "@/lib/studio/generators/ai-types";
import type { Character } from "@/lib/studio/generators/zod-schemas.generated";

export async function POST(request: NextRequest) {
	try {
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("🎭 [PARTS API] Request received");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

		const body = (await request.json()) as {
			storySummary: StorySummaryResult;
			characters: Character[];
			partsCount?: number;
			chaptersPerPart?: number;
		};
		const {
			storySummary,
			characters,
			partsCount = 3,
			chaptersPerPart = 3,
		} = body;

		console.log("[PARTS API] Request parameters:", {
			hasStorySummary: !!storySummary,
			charactersCount: characters?.length || 0,
			partsCount,
			chaptersPerPart,
			totalChapters: partsCount * chaptersPerPart,
		});

		if (!storySummary || !characters || characters.length < 2) {
			console.error("❌ [PARTS API] Validation failed");
			return NextResponse.json(
				{ error: "Story summary and at least 2 characters are required" },
				{ status: 400 },
			);
		}

		console.log("✅ [PARTS API] Validation passed");

		// Identify main characters
		const mainCharacters = characters.filter((c) => c.isMain);
		if (mainCharacters.length === 0) {
			return NextResponse.json(
				{ error: "At least one main character is required" },
				{ status: 400 },
			);
		}

		console.log("[PARTS API] 🤖 Calling parts generator...");

		// Use the common generator (does NOT save to database)
		const generationResult = await generateParts({
			storyId: "temp_story_id", // API route doesn't have storyId yet
			userId: "temp_user_id", // API route doesn't have userId yet
			story: storySummary,
			characters: characters,
			settings: [], // Parts generator doesn't use settings in its current implementation
			partsCount,
			language: "English",
		});

		console.log("[PARTS API] ✅ Parts generation completed");
		console.log("[PARTS API] Result summary:", {
			partsCount: generationResult.parts.length,
			partTitles: generationResult.parts.map((p) => p.title).join(", "),
			generationTime: generationResult.metadata.generationTime,
		});
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		// Return just the parts array (maintain API contract)
		return NextResponse.json(generationResult.parts);
	} catch (error) {
		console.error("Parts generation error:", error);
		return NextResponse.json(
			{
				error: "Failed to generate parts",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

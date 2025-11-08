import { type NextRequest, NextResponse } from "next/server";
import type {
	CharacterGenerationResult,
	PartGenerationResult,
	SettingGenerationResult,
	StorySummaryResult,
} from "@/lib/novels/types";
import { generateChapters } from "@/lib/studio/generators";

export async function POST(request: NextRequest) {
	try {
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("📑 [CHAPTERS API] Request received");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

		const body = (await request.json()) as {
			storySummary: StorySummaryResult;
			parts: PartGenerationResult[];
			characters: CharacterGenerationResult[];
			settings: SettingGenerationResult[];
			chaptersPerPart?: number;
		};
		const {
			storySummary,
			parts,
			characters,
			settings,
			chaptersPerPart = 3,
		} = body;

		console.log("[CHAPTERS API] Request body summary:", {
			hasStorySummary: !!storySummary,
			partsCount: parts?.length || 0,
			charactersCount: characters?.length || 0,
			settingsCount: settings?.length || 0,
			chaptersPerPart,
		});

		if (
			!storySummary ||
			!parts ||
			!characters ||
			!settings ||
			characters.length === 0
		) {
			console.error("❌ [CHAPTERS API] Validation failed");
			return NextResponse.json(
				{
					error: "Story summary, parts, characters, and settings are required",
				},
				{ status: 400 },
			);
		}

		console.log("✅ [CHAPTERS API] Validation passed");
		console.log("[CHAPTERS API] 🤖 Calling chapters generator...");

		// Use the common generator (does NOT save to database)
		const generationResult = await generateChapters({
			storyId: "temp_story_id", // API route doesn't have storyId yet
			userId: "temp_user_id", // API route doesn't have userId yet
			story: storySummary,
			parts,
			characters,
			settings,
			chaptersPerPart,
			language: "English",
		});

		console.log("[CHAPTERS API] ✅ Chapters generation completed");
		console.log("[CHAPTERS API] Result summary:", {
			chaptersCount: generationResult.chapters.length,
			generationTime: generationResult.metadata.generationTime,
		});
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		// Return just the chapters array (maintain API contract)
		return NextResponse.json(generationResult.chapters);
	} catch (error) {
		console.error("Chapters generation error:", error);
		return NextResponse.json(
			{
				error: "Failed to generate chapters",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

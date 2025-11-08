import { type NextRequest, NextResponse } from "next/server";
import { generateSceneSummaries } from "@/lib/studio/generators";
import type { StorySummaryResult } from "@/lib/studio/generators/ai-types";
import type {
	Chapter,
	Character,
	Setting,
} from "@/lib/studio/generators/zod-schemas.generated";

export async function POST(request: NextRequest) {
	try {
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("🎬 [SCENE SUMMARIES API] Request received");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

		const body = (await request.json()) as {
			storySummary: StorySummaryResult;
			chapters: Chapter[];
			characters: Character[];
			settings: Setting[];
			scenesPerChapter?: number;
		};
		const {
			storySummary,
			chapters,
			characters,
			settings,
			scenesPerChapter = 6,
		} = body;

		console.log("[SCENE SUMMARIES API] Request parameters:", {
			hasStorySummary: !!storySummary,
			chaptersCount: chapters?.length || 0,
			charactersCount: characters?.length || 0,
			settingsCount: settings?.length || 0,
			scenesPerChapter,
		});

		if (!storySummary || !chapters || !characters || !settings) {
			console.error("❌ [SCENE SUMMARIES API] Validation failed");
			return NextResponse.json(
				{
					error:
						"Story summary, chapters, characters, and settings are required",
				},
				{ status: 400 },
			);
		}

		console.log("✅ [SCENE SUMMARIES API] Validation passed");
		console.log(
			"[SCENE SUMMARIES API] 🤖 Calling scene summaries generator...",
		);

		// Use the common generator (does NOT save to database)
		const generationResult = await generateSceneSummaries({
			storyId: "temp_story_id", // API route doesn't have storyId yet
			userId: "temp_user_id", // API route doesn't have userId yet
			story: storySummary,
			chapters,
			characters,
			settings,
			scenesPerChapter,
			language: "English",
		});

		console.log(
			"[SCENE SUMMARIES API] ✅ Scene summaries generation completed",
		);
		console.log("[SCENE SUMMARIES API] Result summary:", {
			scenesCount: generationResult.scenes.length,
			generationTime: generationResult.metadata.generationTime,
		});
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		// Return just the scenes array (maintain API contract)
		return NextResponse.json(generationResult.scenes);
	} catch (error) {
		console.error("Scene summaries generation error:", error);
		return NextResponse.json(
			{
				error: "Failed to generate scene summaries",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

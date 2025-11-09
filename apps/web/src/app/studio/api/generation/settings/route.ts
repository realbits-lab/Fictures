import { type NextRequest, NextResponse } from "next/server";
import { generateSettings } from "@/lib/studio/generators";
import type { StorySummaryResult } from "@/lib/studio/generators/ai-types";

export async function POST(request: NextRequest) {
	try {
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("🏛️  [SETTINGS API] Request received");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

		const body = (await request.json()) as { storySummary: StorySummaryResult };
		const { storySummary } = body;

		console.log("[SETTINGS API] Request summary:", {
			hasStorySummary: !!storySummary,
			genre: storySummary?.genre,
			tone: storySummary?.tone,
			characterCount: storySummary?.characters?.length || 0,
		});

		if (!storySummary) {
			console.error(
				"❌ [SETTINGS API] Validation failed: Story summary is missing",
			);
			return NextResponse.json(
				{ error: "Story summary is required" },
				{ status: 400 },
			);
		}

		console.log("✅ [SETTINGS API] Validation passed");
		console.log("[SETTINGS API] 🤖 Calling settings generator...");

		// Use the common generator (does NOT save to database)
		const generationResult = await generateSettings({
			storyId: "temp_story_id", // API route doesn't have storyId yet
			story: storySummary,
			settingCount: 3, // Default to 3 settings (2-3 is the standard)
		});

		console.log("[SETTINGS API] ✅ Settings generation completed");
		console.log("[SETTINGS API] Result summary:", {
			count: generationResult.settings.length,
			settingNames: generationResult.settings.map((s) => s.name).join(", "),
			generationTime: generationResult.metadata.generationTime,
		});

		console.log("✅ [SETTINGS API] All validations passed, returning result");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		// Return just the settings array (maintain API contract)
		return NextResponse.json(generationResult.settings);
	} catch (error) {
		console.error("Settings generation error:", error);
		return NextResponse.json(
			{
				error: "Failed to generate settings",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

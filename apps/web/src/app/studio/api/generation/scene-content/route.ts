import { type NextRequest, NextResponse } from "next/server";
import { generateSceneContent } from "@/lib/studio/generators";
import type {
	Character,
	Scene,
	Setting,
} from "@/lib/studio/generators/zod-schemas.generated";

interface ChapterContext {
	title: string;
	summary: string;
	virtueType: string;
}

interface StoryContext {
	genre: string;
	tone: string;
	moralFramework: string;
}

export async function POST(request: NextRequest) {
	try {
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("✍️  [SCENE CONTENT API] Request received");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

		const body = (await request.json()) as {
			sceneSummary: Scene;
			characters: Character[];
			settings: Setting[];
			chapterContext: ChapterContext;
			storyContext: StoryContext;
		};

		const { sceneSummary, characters, settings, chapterContext, storyContext } =
			body;

		console.log("[SCENE CONTENT API] Request parameters:", {
			hasSceneSummary: !!sceneSummary,
			sceneTitle: sceneSummary?.title,
			cyclePhase: sceneSummary?.cyclePhase,
			suggestedLength: sceneSummary?.suggestedLength,
			charactersCount: characters?.length || 0,
		});

		if (!sceneSummary || !characters || !settings) {
			console.error("❌ [SCENE CONTENT API] Validation failed");
			return NextResponse.json(
				{ error: "Scene summary, characters, and settings are required" },
				{ status: 400 },
			);
		}

		console.log("✅ [SCENE CONTENT API] Validation passed");
		console.log("[SCENE CONTENT API] 🤖 Calling scene content generator...");

		// Convert SceneSummaryResult to Scene type for generator
		// Note: The generator expects a Scene type with additional fields
		const sceneWithIds = {
			...sceneSummary,
			id: "temp_scene_id",
			chapterId: "temp_chapter_id",
			content: "",
			emotionalTone: sceneSummary.emotionalBeat,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const chapterWithIds = {
			id: "temp_chapter_id",
			storyId: "temp_story_id",
			partId: "temp_part_id",
			title: chapterContext.title,
			summary: chapterContext.summary,
			orderIndex: 0,
			characterId: characters[0]?.id || "",
			virtueType: chapterContext.virtueType as
				| "courage"
				| "compassion"
				| "integrity"
				| "loyalty"
				| "wisdom"
				| "sacrifice",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const storyWithIds = {
			id: "temp_story_id",
			userId: "temp_user_id",
			title: "Story Title",
			genre: storyContext.genre,
			tone: storyContext.tone,
			summary: "",
			moralFramework: storyContext.moralFramework,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Use the common generator (does NOT save to database)
		const generationResult = await generateSceneContent({
			sceneId: "temp_scene_id",
			userId: "temp_user_id",
			scene: sceneWithIds,
			chapter: chapterWithIds,
			story: storyWithIds,
			characters,
			settings,
			language: "English",
		});

		console.log("[SCENE CONTENT API] ✅ Scene content generation completed");
		console.log("[SCENE CONTENT API] Result summary:", {
			contentLength: generationResult.content.length,
			wordCount: generationResult.wordCount,
			generationTime: generationResult.metadata.generationTime,
		});
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		// Return in the expected format (matches old API contract)
		return NextResponse.json({
			content: generationResult.content,
			emotionalTone: sceneSummary.emotionalBeat,
		});
	} catch (error) {
		console.error("Scene content generation error:", error);
		return NextResponse.json(
			{
				error: "Failed to generate scene content",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

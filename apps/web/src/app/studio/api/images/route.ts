import { type NextRequest, NextResponse } from "next/server";
import { generateImages } from "@/lib/studio/generators";
import type {
	CharacterGenerationResult,
	SceneSummaryResult,
	SettingGenerationResult,
} from "@/lib/studio/generators/ai-types";

interface StoryData {
	title: string;
	genre: string;
	summary: string;
	tone: string;
}

interface ImageGenerationRequest {
	storyId: string;
	imageType: "story" | "character" | "setting" | "scene";
	targetData:
		| StoryData
		| CharacterGenerationResult
		| SettingGenerationResult
		| (SceneSummaryResult & { content?: string });
	chapterId?: string;
	sceneId?: string;
}

/**
 * API 9: Image Generation (All Story Assets)
 *
 * Generates images for story covers, characters, settings, and scenes using Gemini 2.5 Flash Image.
 * Automatically creates optimized variants for mobile devices.
 *
 * Dimensions: 1344×768 (7:4 aspect ratio)
 * Optimization: 4 variants (AVIF/JPEG × mobile 1x/2x)
 */
export async function POST(request: NextRequest) {
	try {
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("🎨 [IMAGES API] Request received");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

		const body = (await request.json()) as ImageGenerationRequest;
		const { storyId, imageType, targetData, chapterId, sceneId } = body;

		console.log("[IMAGES API] Request parameters:", {
			storyId,
			imageType,
			hasTargetData: !!targetData,
			chapterId,
			sceneId,
		});

		if (!storyId || !imageType || !targetData) {
			console.error("❌ [IMAGES API] Validation failed");
			return NextResponse.json(
				{ error: "storyId, imageType, and targetData are required" },
				{ status: 400 },
			);
		}

		console.log("✅ [IMAGES API] Validation passed");
		console.log(`[IMAGES API] 🎨 Calling images generator for ${imageType}...`);

		// Prepare data based on image type
		let storyData: StoryData | undefined;
		let characters: CharacterGenerationResult[] | undefined;
		let settings: SettingGenerationResult[] | undefined;
		let scenes: (SceneSummaryResult & { content?: string })[] | undefined;

		switch (imageType) {
			case "story":
				storyData = targetData as StoryData;
				break;
			case "character":
				characters = [targetData as CharacterGenerationResult];
				break;
			case "setting":
				settings = [targetData as SettingGenerationResult];
				break;
			case "scene":
				scenes = [targetData as SceneSummaryResult & { content?: string }];
				break;
		}

		// Use the common generator (does NOT save to database)
		const generationResult = await generateImages({
			storyId,
			story: storyData
				? {
						id: storyId,
						title: storyData.title,
						genre: storyData.genre,
						tone: storyData.tone,
						summary: storyData.summary,
						moralFramework: "",
						createdAt: new Date(),
						updatedAt: new Date(),
					}
				: undefined,
			characters: characters?.map((c) => ({
				...c,
				id: c.id || "temp_char_id",
				storyId,
				createdAt: new Date(),
				updatedAt: new Date(),
			})),
			settings: settings?.map((s) => ({
				...s,
				id: s.id || "temp_setting_id",
				storyId,
				createdAt: new Date(),
				updatedAt: new Date(),
			})),
			scenes: scenes?.map((s) => ({
				...s,
				id: sceneId || "temp_scene_id",
				chapterId: chapterId || "temp_chapter_id",
				content: s.content || "",
				emotionalTone: s.emotionalBeat,
				createdAt: new Date(),
				updatedAt: new Date(),
			})),
			imageTypes: [imageType],
		});

		console.log("[IMAGES API] ✅ Image generation completed");
		console.log("[IMAGES API] Result summary:", {
			imagesGenerated: generationResult.generatedImages.length,
			generationTime: generationResult.metadata.generationTime,
		});
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		// Return the first (and only) image result in the expected format
		const imageResult = generationResult.generatedImages[0];
		if (!imageResult) {
			throw new Error("No image generated");
		}

		return NextResponse.json({
			success: true,
			imageType,
			imageId: imageResult.entityId,
			originalUrl: imageResult.imageUrl,
			blobUrl: imageResult.imageUrl,
			dimensions: {
				width: 1344,
				height: 768,
			},
			size: 0, // Not provided by generator
			optimizedSet: imageResult.variants,
			isPlaceholder: false,
		});
	} catch (error) {
		console.error("[API 9] Image generation error:", error);
		return NextResponse.json(
			{
				error: "Failed to generate image",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

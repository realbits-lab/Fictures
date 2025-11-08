/**
 * Images Generator
 *
 * Generates and optimizes images for story assets.
 * This is the ninth (final) phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { generateStoryImage } from "@/lib/services/image-generation";
import type { GenerateImagesParams, GenerateImagesResult } from "./types";

/**
 * Generate images for story assets
 *
 * @param params - Images generation parameters
 * @returns Generated images data (caller responsible for database save)
 */
export async function generateImages(
	params: GenerateImagesParams,
): Promise<GenerateImagesResult> {
	const startTime = Date.now();
	const {
		storyId,
		story,
		characters = [],
		settings = [],
		scenes = [],
		imageTypes,
		onProgress,
	} = params;

	const generatedImages: GenerateImagesResult["generatedImages"] = [];
	let imageCount = 0;

	// Calculate total images to generate
	const totalImages =
		(imageTypes.includes("story") ? 1 : 0) +
		(imageTypes.includes("character") ? characters.length : 0) +
		(imageTypes.includes("setting") ? settings.length : 0) +
		(imageTypes.includes("scene") ? scenes.length : 0);

	// Generate story cover image
	if (imageTypes.includes("story") && story) {
		imageCount++;
		if (onProgress) onProgress(imageCount, totalImages);

		const prompt = `Story cover illustration for "${story.title}". ${story.summary}. Genre: ${story.genre}. Cinematic, professional book cover style.`;

		const result = await generateStoryImage({
			prompt,
			storyId,
			imageType: "story",
			style: "vivid",
			quality: "standard",
		});

		generatedImages.push({
			type: "story",
			entityId: storyId,
			imageUrl: result.url,
			variants: result.optimizedSet,
		});

		console.log(`[images-generator] Generated story cover image:`, {
			imageId: result.imageId,
			url: result.url,
		});
	}

	// Generate character images
	if (imageTypes.includes("character")) {
		for (const character of characters) {
			imageCount++;
			if (onProgress) onProgress(imageCount, totalImages);

			const prompt = `Character portrait: ${character.name}. ${character.summary}. Appearance: ${character.appearance.physicalDescription}. Style: ${character.visualStyle || "realistic"}, professional character art.`;

			const result = await generateStoryImage({
				prompt,
				storyId,
				imageType: "character",
				style: "vivid",
				quality: "standard",
			});

			generatedImages.push({
				type: "character",
				entityId: character.id,
				imageUrl: result.url,
				variants: result.optimizedSet,
			});

			console.log(`[images-generator] Generated character image:`, {
				characterId: character.id,
				characterName: character.name,
				imageId: result.imageId,
			});
		}
	}

	// Generate setting images
	if (imageTypes.includes("setting")) {
		for (const setting of settings) {
			imageCount++;
			if (onProgress) onProgress(imageCount, totalImages);

			const prompt = `Setting illustration: ${setting.name}. ${setting.description}. Mood: ${setting.mood}. Sensory details: ${setting.sensory?.sight?.join(", ")}. Style: ${setting.visualStyle || "realistic"}, cinematic environment art.`;

			const result = await generateStoryImage({
				prompt,
				storyId,
				imageType: "setting",
				style: "vivid",
				quality: "standard",
			});

			generatedImages.push({
				type: "setting",
				entityId: setting.id,
				imageUrl: result.url,
				variants: result.optimizedSet,
			});

			console.log(`[images-generator] Generated setting image:`, {
				settingId: setting.id,
				settingName: setting.name,
				imageId: result.imageId,
			});
		}
	}

	// Generate scene images
	if (imageTypes.includes("scene")) {
		for (const scene of scenes) {
			imageCount++;
			if (onProgress) onProgress(imageCount, totalImages);

			const prompt = `Scene illustration: ${scene.title}. ${scene.summary}. Emotional beat: ${scene.emotionalBeat}. Sensory anchors: ${scene.sensoryAnchors?.join(", ")}. Cinematic, widescreen composition.`;

			const result = await generateStoryImage({
				prompt,
				storyId,
				imageType: "scene",
				style: "vivid",
				quality: "standard",
			});

			generatedImages.push({
				type: "scene",
				entityId: scene.id || `scene_${imageCount}`,
				imageUrl: result.url,
				variants: result.optimizedSet,
			});

			console.log(`[images-generator] Generated scene image:`, {
				sceneId: scene.id,
				sceneTitle: scene.title,
				imageId: result.imageId,
			});
		}
	}

	console.log("[images-generator] All images generated:", {
		count: generatedImages.length,
		generationTime: Date.now() - startTime,
	});

	return {
		generatedImages,
		metadata: {
			totalGenerated: generatedImages.length,
			generationTime: Date.now() - startTime,
		},
	};
}

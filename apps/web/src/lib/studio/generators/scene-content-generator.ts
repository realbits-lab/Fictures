/**
 * Scene Content Generator
 *
 * Generates prose content for individual scenes.
 * This is the seventh phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "./ai-client";
import type {
	GenerateSceneContentParams,
	GenerateSceneContentResult,
} from "./types";

/**
 * Generate prose content for a single scene
 *
 * @param params - Scene content generation parameters
 * @returns Scene content (caller responsible for database save)
 */
export async function generateSceneContent(
	params: GenerateSceneContentParams,
): Promise<GenerateSceneContentResult> {
	const startTime = Date.now();
	const { scene, characters, settings, language = "English" } = params;

	// Find the setting and character for this scene
	const setting = settings.find((s) => s.id === scene.settingId);
	const character = characters.find((c) =>
		scene.characterFocus?.includes(c.id),
	);

	// Generate scene content using template
	const response = await textGenerationClient.generateWithTemplate(
		"scene_content",
		{
			sceneSummary: scene.summary,
			cyclePhase: scene.cyclePhase,
			emotionalBeat: scene.emotionalBeat || "neutral",
			suggestedLength: scene.suggestedLength || "medium",
			settingDescription: setting
				? `${setting.name} - ${setting.description}`
				: "Generic setting",
			sensoryAnchors: scene.sensoryAnchors
				? scene.sensoryAnchors.join(", ")
				: "Use setting-appropriate details",
			characterName: character ? character.name : "Unknown character",
			voiceStyle: character
				? `${character.voiceStyle.tone}, ${character.voiceStyle.vocabulary}`
				: "Neutral",
			language,
		},
		{
			temperature: 0.85,
			maxTokens: 8192,
		},
	);

	const content = response.text.trim();
	const wordCount = content.split(/\s+/).length;

	console.log("[scene-content-generator] Generated scene content:", {
		sceneId: params.sceneId,
		wordCount,
		generationTime: Date.now() - startTime,
	});

	return {
		content,
		wordCount,
		metadata: {
			generationTime: Date.now() - startTime,
			model: response.model,
		},
	};
}

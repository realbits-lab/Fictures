/**
 * Scene Content Generator
 *
 * Generates prose content for individual scenes.
 * This is the seventh phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "@/lib/novels/ai-client";
import { SCENE_CONTENT_PROMPT } from "@/lib/novels/system-prompts";
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

	// Build scene content prompt
	const sceneContentPrompt = `${SCENE_CONTENT_PROMPT}

Generate prose content for this scene.

Scene Summary: ${scene.summary}
Cycle Phase: ${scene.cyclePhase}
Emotional Beat: ${scene.emotionalBeat}
Suggested Length: ${scene.suggestedLength} (300-800 words)

Setting: ${setting ? `${setting.name} - ${setting.description}` : "Generic setting"}
Sensory Details: ${scene.sensoryAnchors ? scene.sensoryAnchors.join(", ") : "Use setting-appropriate details"}

Character: ${character ? `${character.name} - ${character.summary}` : "Unknown character"}
Voice Style: ${character ? `${character.voiceStyle.tone}, ${character.voiceStyle.vocabulary}` : "Neutral"}

Write the scene content in ${language}. Use strong sensory details, natural dialogue, and mobile-optimized formatting (max 3 sentences per paragraph).

Return only the prose content (no JSON, no wrapper).`;

	// Generate scene content
	const response = await textGenerationClient.generate({
		prompt: sceneContentPrompt,
		temperature: 0.85,
		maxTokens: 8192,
	});

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

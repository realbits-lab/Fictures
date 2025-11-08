/**
 * Story Generator
 *
 * Generates story foundation using the Adversity-Triumph Engine.
 * This is the first phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "./ai-client";
import type { StorySummaryResult } from "./ai-types";
import { StorySummaryJsonSchema } from "./json-schemas";
import type { GenerateStoryParams, GenerateStoryResult } from "./types";

/**
 * Generate story foundation from user prompt
 *
 * @param params - Story generation parameters
 * @returns Story data (caller responsible for database save)
 */
export async function generateStory(
	params: GenerateStoryParams,
): Promise<GenerateStoryResult> {
	const startTime = Date.now();

	// Generate story data using template
	const response = await textGenerationClient.generateWithTemplate(
		"story",
		{
			userPrompt: params.userPrompt,
			genre: params.preferredGenre || "Any",
			tone: params.preferredTone || "hopeful",
			language: params.language || "English",
		},
		{
			temperature: 0.8,
			maxTokens: 8192,
			responseFormat: "json",
			responseSchema: StorySummaryJsonSchema,
		},
	);

	console.log("[story-generator] AI response:", {
		text: response.text,
		length: response.text?.length || 0,
		model: response.model,
		tokensUsed: response.tokensUsed,
		finishReason: response.finishReason,
	});

	if (!response.text || response.text.trim() === "") {
		throw new Error("Empty response from AI model for story");
	}

	const storyData: StorySummaryResult = JSON.parse(response.text);

	// Validate result
	if (!storyData.title || !storyData.genre || !storyData.moralFramework) {
		throw new Error("Invalid story data generated - missing required fields");
	}

	console.log("[story-generator] Story generated:", {
		title: storyData.title,
		genre: storyData.genre,
	});

	return {
		story: storyData,
		storyId: "", // Populated by caller after database save
		metadata: {
			generationTime: Date.now() - startTime,
			model: response.model,
		},
	};
}

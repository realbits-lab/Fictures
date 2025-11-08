/**
 * Story Generator
 *
 * Generates story foundation using the Adversity-Triumph Engine.
 * This is the first phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "@/lib/novels/ai-client";
import { StorySummaryJsonSchema } from "@/lib/novels/json-schemas";
import { STORY_SUMMARY_PROMPT } from "@/lib/novels/system-prompts";
import type { StorySummaryResult } from "@/lib/novels/types";
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

	// Build prompt
	const prompt = `${STORY_SUMMARY_PROMPT}

User Request: ${params.userPrompt}
Preferred Genre: ${params.preferredGenre || "Any"}
Preferred Tone: ${params.preferredTone || "hopeful"}
Language: ${params.language || "English"}

Generate a story foundation with:
1. Title (engaging and memorable)
2. Genre (specific genre classification)
3. Summary (2-3 sentences describing the thematic premise and moral framework)
4. Tone (hopeful, dark, bittersweet, or satirical)
5. Moral Framework (what virtues are valued in this story?)`;

	// Generate story data
	const response = await textGenerationClient.generate({
		prompt,
		temperature: 0.8,
		maxTokens: 8192,
		responseFormat: "json",
		responseSchema: StorySummaryJsonSchema,
	});

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

/**
 * Characters Generator
 *
 * Generates character profiles using the Adversity-Triumph Engine.
 * This is the second phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { CharacterJsonSchema } from "@/lib/novels/json-schemas";
import { textGenerationClient } from "./ai-client";
import type { Character } from "./ai-types";
import type {
	GenerateCharactersParams,
	GenerateCharactersResult,
} from "./types";

/**
 * Generate character profiles for a story
 *
 * @param params - Character generation parameters
 * @returns Character data (caller responsible for database save)
 */
export async function generateCharacters(
	params: GenerateCharactersParams,
): Promise<GenerateCharactersResult> {
	const startTime = Date.now();
	const { story, characterCount, language = "English", onProgress } = params;

	const characters: Character[] = [];

	for (let i = 0; i < characterCount; i++) {
		// Report progress
		if (onProgress) {
			onProgress(i + 1, characterCount);
		}

		// Generate character using template
		const response = await textGenerationClient.generateWithTemplate(
			"character",
			{
				characterNumber: String(i + 1),
				characterCount: String(characterCount),
				storyTitle: story.title,
				storyGenre: story.genre,
				storySummary: story.summary,
				moralFramework: story.moralFramework,
				characterType: i === 0 ? "main protagonist" : "supporting character",
				language,
			},
			{
				temperature: 0.9,
				maxTokens: 8192,
				responseFormat: "json",
				responseSchema: CharacterJsonSchema,
			},
		);

		const characterData = JSON.parse(response.text);
		characters.push(characterData);

		console.log(
			`[characters-generator] Generated character ${i + 1}/${characterCount}:`,
			{
				name: characterData.name,
				coreTrait: characterData.coreTrait,
			},
		);
	}

	console.log("[characters-generator] All characters generated:", {
		count: characters.length,
		generationTime: Date.now() - startTime,
	});

	return {
		characters,
		metadata: {
			totalGenerated: characters.length,
			generationTime: Date.now() - startTime,
		},
	};
}

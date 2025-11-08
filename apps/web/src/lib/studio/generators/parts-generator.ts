/**
 * Parts Generator
 *
 * Generates story parts (acts) using the Adversity-Triumph Engine.
 * This is the fourth phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { PartJsonSchema } from "@/lib/novels/json-schemas";
import { textGenerationClient } from "./ai-client";
import type { Part } from "./ai-types";
import type { GeneratePartsParams, GeneratePartsResult } from "./types";

/**
 * Generate story parts (acts)
 *
 * @param params - Parts generation parameters
 * @returns Parts data (caller responsible for database save)
 */
export async function generateParts(
	params: GeneratePartsParams,
): Promise<GeneratePartsResult> {
	const startTime = Date.now();
	const { story, characters, partsCount, onProgress } = params;

	const parts: Part[] = [];

	for (let i = 0; i < partsCount; i++) {
		// Report progress
		if (onProgress) {
			onProgress(i + 1, partsCount);
		}

		// Build character list string
		const charactersStr = characters
			.map((c) => `- ${c.name}: ${c.coreTrait} (flaw: ${c.internalFlaw})`)
			.join("\n");

		// Generate part using template
		const response = await textGenerationClient.generateWithTemplate(
			"part",
			{
				partNumber: String(i + 1),
				storyTitle: story.title,
				storyGenre: story.genre,
				storySummary: story.summary,
				moralFramework: story.moralFramework,
				characters: charactersStr,
			},
			{
				temperature: 0.85,
				maxTokens: 8192,
				responseFormat: "json",
				responseSchema: PartJsonSchema,
			},
		);

		const partData = JSON.parse(response.text);
		parts.push(partData);

		console.log(`[parts-generator] Generated part ${i + 1}/${partsCount}:`, {
			title: partData.title,
			characterArcs: partData.characterArcs?.length || 0,
		});
	}

	console.log("[parts-generator] All parts generated:", {
		count: parts.length,
		generationTime: Date.now() - startTime,
	});

	return {
		parts,
		metadata: {
			totalGenerated: parts.length,
			generationTime: Date.now() - startTime,
		},
	};
}

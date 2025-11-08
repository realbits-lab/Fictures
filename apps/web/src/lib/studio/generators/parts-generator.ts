/**
 * Parts Generator
 *
 * Generates story parts (acts) using the Adversity-Triumph Engine.
 * This is the fourth phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "@/lib/novels/ai-client";
import { PartJsonSchema } from "@/lib/novels/json-schemas";
import type { Part } from "@/lib/novels/types";
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

		// Build part prompt
		const partPrompt = `Generate Part ${i + 1} (Act ${i + 1}) for the story using the Adversity-Triumph Engine.

Story Context:
Title: ${story.title}
Genre: ${story.genre}
Summary: ${story.summary}
Moral Framework: ${story.moralFramework}

Characters:
${characters.map((c) => `- ${c.name}: ${c.coreTrait} (flaw: ${c.internalFlaw})`).join("\n")}

Generate a part with MACRO adversity-triumph arcs for each character.

Return as JSON:
{
  "id": "part_${i + 1}",
  "title": "Act ${i + 1}: ...",
  "summary": "...",
  "orderIndex": ${i},
  "characterArcs": [
    {
      "characterId": "char_1",
      "macroAdversity": {
        "internal": "...",
        "external": "..."
      },
      "macroVirtue": "...",
      "macroConsequence": "...",
      "macroNewAdversity": "...",
      "estimatedChapters": 1,
      "arcPosition": "primary",
      "progressionStrategy": "..."
    }
  ]
}`;

		// Generate part
		const response = await textGenerationClient.generate({
			prompt: partPrompt,
			temperature: 0.85,
			maxTokens: 8192,
			responseFormat: "json",
			responseSchema: PartJsonSchema,
		});

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

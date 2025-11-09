/**
 * Parts Generator
 *
 * Generates story parts (acts) using the Adversity-Triumph Engine.
 * This is the fourth phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "./ai-client";
import { PartJsonSchema } from "./json-schemas.generated";
import type { GeneratePartsParams, GeneratePartsResult } from "./types";
import type { Part } from "./zod-schemas.generated";

/**
 * Generate story parts (acts)
 *
 * @param params - Parts generation parameters
 * @returns Parts data (caller responsible for database save)
 */
export async function generateParts(
    params: GeneratePartsParams,
): Promise<GeneratePartsResult> {
    const startTime: number = Date.now();

    // 1. Extract and set default parameters
    const { story, characters, partsCount, onProgress }: GeneratePartsParams =
        params;

    const parts: Part[] = [];

    // 2. Generate each part in sequence
    for (let i = 0; i < partsCount; i++) {
        console.log(
            `[parts-generator] 🎬 Generating part ${i + 1}/${partsCount}...`,
        );

        // 3. Report progress callback if provided
        if (onProgress) {
            onProgress(i + 1, partsCount);
        }

        // 4. Build character list string
        const charactersStr: string = characters
            .map((c) => `- ${c.name}: ${c.coreTrait} (flaw: ${c.internalFlaw})`)
            .join("\n");

        console.log(
            `[parts-generator] Character list prepared: ${characters.length} characters`,
        );

        // 5. Generate part using template
        const response: Awaited<
            ReturnType<typeof textGenerationClient.generateWithTemplate>
        > = await textGenerationClient.generateWithTemplate(
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

        console.log(`[parts-generator] AI response received for part ${i + 1}`);

        // 6. Parse and validate part data
        const partData: Part = JSON.parse(response.text) as Part;
        parts.push(partData);

        console.log(
            `[parts-generator] ✅ Generated part ${i + 1}/${partsCount}:`,
            {
                title: partData.title,
                summary: partData.summary?.substring(0, 50) || "N/A",
                characterArcs: partData.characterArcs?.length || 0,
            },
        );
    }

    // 7. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log("[parts-generator] ✅ All parts generated successfully:", {
        count: parts.length,
        generationTime: totalTime,
    });

    // 8. Build and return result with metadata
    const result: GeneratePartsResult = {
        parts,
        metadata: {
            totalGenerated: parts.length,
            generationTime: totalTime,
        },
    };

    return result;
}

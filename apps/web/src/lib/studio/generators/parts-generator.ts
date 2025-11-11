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
import {
    buildDetailedCharactersContext,
    buildDetailedSettingsContext,
    buildDetailedStoryContext,
} from "./context-builders";
import { promptManager } from "./prompt-manager";
import type {
    GeneratePartsParams,
    GeneratePartsResult,
    PartPromptParams,
} from "./types";
import {
    type GeneratedPartData,
    GeneratedPartSchema,
} from "./zod-schemas.generated";

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
    const {
        story,
        characters,
        settings,
        partsCount,
        onProgress,
    }: GeneratePartsParams = params;

    const parts: GeneratedPartData[] = [];

    // 2. Generate each part in sequence
    for (let i = 0; i < partsCount; i++) {
        console.log(
            `[parts-generator] 🎬 Generating part ${i + 1}/${partsCount}...`,
        );

        // 3. Report progress callback if provided
        if (onProgress) {
            onProgress(i + 1, partsCount);
        }

        // 4. Build context strings using detailed builders
        const charactersStr: string =
            buildDetailedCharactersContext(characters);
        const settingsStr: string = buildDetailedSettingsContext(settings);
        const storyContext: string = buildDetailedStoryContext(story);

        console.log(
            `[parts-generator] Context prepared: ${characters.length} characters, ${settings.length} settings`,
        );

        // 5. Get the prompt template for part generation
        const promptParams: PartPromptParams = {
            partNumber: String(i + 1),
            story: storyContext,
            characters: charactersStr,
            settings: settingsStr,
            previousPartsContext:
                "None (this is the first part in a batch generation)",
        };

        const {
            system: systemPrompt,
            user: userPromptText,
        }: { system: string; user: string } = promptManager.getPrompt(
            textGenerationClient.getProviderType(),
            "part",
            promptParams,
        );

        console.log(
            `[parts-generator] Generating part ${i + 1} using structured output`,
        );

        // 8. Generate part using structured output
        const partData: GeneratedPartData =
            await textGenerationClient.generateStructured(
                userPromptText,
                GeneratedPartSchema,
                {
                    systemPrompt,
                    temperature: 0.85,
                    maxTokens: 8192,
                },
            );

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

    // 9. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log("[parts-generator] ✅ All parts generated successfully:", {
        count: parts.length,
        generationTime: totalTime,
    });

    // 10. Build and return result with metadata
    const result: GeneratePartsResult = {
        parts,
        metadata: {
            totalGenerated: parts.length,
            generationTime: totalTime,
        },
    };

    return result;
}

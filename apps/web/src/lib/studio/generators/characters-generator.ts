/**
 * Characters Generator
 *
 * Generates character profiles using the Adversity-Triumph Engine.
 * This is the second phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import type {
    CharacterPromptParams,
    GeneratorCharactersParams,
    GeneratorCharactersResult,
} from "@/lib/schemas/generators/types";
import {
    type AiCharacterType,
    AiCharacterZodSchema,
} from "@/lib/schemas/zod/ai";
import { createTextGenerationClient } from "./ai-client";
import { buildStoryContext } from "./context-builders";
import { promptManager } from "./prompt-manager";

/**
 * Generate character profiles for a story
 *
 * @param params - Character generation parameters
 * @returns Character data (caller responsible for database save)
 */
export async function generateCharacters(
    params: GeneratorCharactersParams,
): Promise<GeneratorCharactersResult> {
    const startTime: number = Date.now();

    // 1. Extract and set default parameters
    const {
        story,
        characterCount,
        language = "English",
        onProgress,
    }: GeneratorCharactersParams = params;

    // 2. Create text generation client with API key
    const client = createTextGenerationClient();

    const characters: AiCharacterType[] = [];

    // 2. Build story context once (used for all characters)
    const storyContext: string = buildStoryContext(story);
    console.log("[characters-generator] Story context prepared");

    // 3. Generate each character in sequence
    for (let i = 0; i < characterCount; i++) {
        console.log(
            `[characters-generator] 👤 Generating character ${i + 1}/${characterCount}...`,
        );

        // 4. Report progress callback if provided
        if (onProgress) {
            onProgress(i + 1, characterCount);
        }

        // 5. Determine character type (main vs supporting)
        const characterType: string =
            i === 0 ? "main protagonist" : "supporting character";
        console.log(`[characters-generator] Character type: ${characterType}`);

        // 6. Get the prompt template for character generation
        const promptParams: CharacterPromptParams = {
            characterNumber: String(i + 1),
            characterCount: String(characterCount),
            story: storyContext,
            characterType,
            language,
        };

        const {
            system: systemPrompt,
            user: userPromptText,
        }: { system: string; user: string } = promptManager.getPrompt(
            client.getProviderType(),
            "character",
            promptParams,
        );

        console.log(
            `[characters-generator] Generating character ${i + 1} using structured output`,
        );

        // 7. Generate character using structured output
        const characterData: AiCharacterType = await client.generateStructured(
            userPromptText,
            AiCharacterZodSchema,
            {
                systemPrompt,
                temperature: 0.3, // Low temperature for consistent JSON structure
                maxTokens: 4096,
            },
        );

        characters.push(characterData);

        console.log(
            `[characters-generator] ✅ Generated character ${i + 1}/${characterCount}:`,
            {
                name: characterData.name,
                coreTrait: characterData.coreTrait,
                internalFlaw: characterData.internalFlaw,
                externalGoal: characterData.externalGoal,
                isMain: characterData.isMain,
            },
        );
    }

    // 8. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log(
        "[characters-generator] ✅ All characters generated successfully:",
        {
            count: characters.length,
            generationTime: totalTime,
        },
    );

    // 9. Build and return result with metadata
    const result: GeneratorCharactersResult = {
        characters,
        metadata: {
            totalGenerated: characters.length,
            generationTime: totalTime,
        },
    };

    return result;
}

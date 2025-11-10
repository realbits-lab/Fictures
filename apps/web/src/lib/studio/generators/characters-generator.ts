/**
 * Characters Generator
 *
 * Generates character profiles using the Adversity-Triumph Engine.
 * This is the second phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "./ai-client";
import { promptManager } from "./prompt-manager";
import type {
    GenerateCharactersParams,
    GenerateCharactersResult,
} from "./types";
import {
    type GeneratedCharacterData,
    GeneratedCharacterSchema,
} from "./zod-schemas.generated";

/**
 * Generate character profiles for a story
 *
 * @param params - Character generation parameters
 * @returns Character data (caller responsible for database save)
 */
export async function generateCharacters(
    params: GenerateCharactersParams,
): Promise<GenerateCharactersResult> {
    const startTime: number = Date.now();

    // 1. Extract and set default parameters
    const {
        story,
        characterCount,
        language = "English",
        onProgress,
    }: GenerateCharactersParams = params;

    const characters: GeneratedCharacterData[] = [];

    // 2. Generate each character in sequence
    for (let i = 0; i < characterCount; i++) {
        console.log(
            `[characters-generator] 👤 Generating character ${i + 1}/${characterCount}...`,
        );

        // 3. Report progress callback if provided
        if (onProgress) {
            onProgress(i + 1, characterCount);
        }

        // 4. Determine character type (main vs supporting)
        const characterType: string =
            i === 0 ? "main protagonist" : "supporting character";
        console.log(`[characters-generator] Character type: ${characterType}`);

        // 5. Get the prompt template for character generation
        const promptParams: {
            characterNumber: string;
            characterCount: string;
            storyTitle: string;
            storyGenre: string;
            storySummary: string;
            moralFramework: string;
            characterType: string;
            language: string;
        } = {
            characterNumber: String(i + 1),
            characterCount: String(characterCount),
            storyTitle: story.title,
            storyGenre: story.genre ?? "General Fiction",
            storySummary: story.summary ?? "A story of adversity and triumph",
            moralFramework: story.moralFramework ?? "Universal human virtues",
            characterType,
            language,
        };

        const {
            system: systemPrompt,
            user: userPromptText,
        }: { system: string; user: string } = promptManager.getPrompt(
            textGenerationClient.getProviderType(),
            "character",
            promptParams,
        );

        console.log(
            `[characters-generator] Generating character ${i + 1} using structured output`,
        );

        // 6. Generate character using structured output
        const characterData: GeneratedCharacterData =
            await textGenerationClient.generateStructured(
                userPromptText,
                GeneratedCharacterSchema,
                {
                    systemPrompt,
                    temperature: 0.9,
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

    // 7. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log(
        "[characters-generator] ✅ All characters generated successfully:",
        {
            count: characters.length,
            generationTime: totalTime,
        },
    );

    // 8. Build and return result with metadata
    const result: GenerateCharactersResult = {
        characters,
        metadata: {
            totalGenerated: characters.length,
            generationTime: totalTime,
        },
    };

    return result;
}

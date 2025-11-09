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
import { CharacterJsonSchema } from "./json-schemas.generated";
import type {
    GenerateCharactersParams,
    GenerateCharactersResult,
} from "./types";
import type { Character } from "./zod-schemas.generated";

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

    const characters: Character[] = [];

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

        // 5. Generate character using template
        const response: Awaited<
            ReturnType<typeof textGenerationClient.generateWithTemplate>
        > = await textGenerationClient.generateWithTemplate(
            "character",
            {
                characterNumber: String(i + 1),
                characterCount: String(characterCount),
                storyTitle: story.title,
                storyGenre: story.genre,
                storySummary: story.summary,
                moralFramework: story.moralFramework,
                characterType,
                language,
            },
            {
                temperature: 0.9,
                maxTokens: 8192,
                responseFormat: "json",
                responseSchema: CharacterJsonSchema,
            },
        );

        console.log(
            `[characters-generator] AI response received for character ${i + 1}`,
        );

        // 6. Parse and validate character data
        const characterData: Character = JSON.parse(response.text) as Character;
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

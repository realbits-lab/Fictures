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
import { promptManager } from "./prompt-manager";
import type {
    GeneratorStoryParams,
    GeneratorStoryResult,
    StoryPromptParams,
} from "./types";
import { type AiStoryType, AiStoryZodSchema } from "./zod-schemas.generated";

/**
 * Generate story foundation from user prompt
 *
 * @param params - Story generation parameters
 * @returns Story data (caller responsible for database save)
 */
export async function generateStory(
    params: GeneratorStoryParams,
): Promise<GeneratorStoryResult> {
    const startTime: number = Date.now();

    // 1. Extract and set default parameters
    const {
        userPrompt,
        preferredGenre = "Slice" as const, // Default to Slice of Life genre
        preferredTone = "hopeful" as const,
        language = "English",
    }: GeneratorStoryParams = params;

    // 2. Get the prompt template for story generation
    const promptParams: StoryPromptParams = {
        userPrompt,
        genre: preferredGenre,
        tone: preferredTone,
        language,
    };

    const {
        system: systemPrompt,
        user: userPromptText,
    }: { system: string; user: string } = promptManager.getPrompt(
        textGenerationClient.getProviderType(),
        "story",
        promptParams,
    );

    console.log(
        "[story-generator] Using generateStructured method with manual schema",
    );

    // 3. Generate story data using structured output method
    const storyData: AiStoryType =
        await textGenerationClient.generateStructured(
            userPromptText,
            AiStoryZodSchema,
            {
                systemPrompt,
                temperature: 0.8,
                maxTokens: 4096,
            },
        );

    console.log("[story-generator] Story generated:", {
        summary: storyData.summary,
        title: storyData.title,
        genre: storyData.genre,
        tone: storyData.tone,
        moralFramework: storyData.moralFramework,
    });

    // 4. Validate result (title and tone are required in the schema)
    if (!storyData.title) {
        throw new Error(
            "Invalid story data generated - missing required fields",
        );
    }

    // 5. Build and return result with metadata
    const result: GeneratorStoryResult = {
        story: storyData,
        metadata: {
            generationTime: Date.now() - startTime,
            model: textGenerationClient.getProviderType(),
        },
    };

    return result;
}

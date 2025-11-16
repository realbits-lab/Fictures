/**
 * Story Generator
 *
 * Generates story foundation using the Adversity-Triumph Engine.
 * This is the first phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import type {
    GenerateStoryParams,
    GenerateStoryResult,
    StoryPromptParams,
} from "@/lib/schemas/generators/types";
import { type AiStoryType, AiStoryZodSchema } from "@/lib/schemas/zod/ai";
import { createTextGenerationClient } from "./ai-client";
import { promptManager } from "./prompt-manager";

/**
 * Generate story foundation from user prompt
 *
 * @param params - Story generation parameters
 * @returns Story data (caller responsible for database save)
 */
export async function generateStory(
    params: GenerateStoryParams,
): Promise<GenerateStoryResult> {
    const startTime: number = Date.now();

    // 1. Extract and set default parameters
    const {
        userPrompt,
        preferredGenre = "Slice" as const, // Default to Slice of Life genre
        preferredTone = "hopeful" as const,
        language = "English",
    }: GenerateStoryParams = params;
    const promptVersion = (params as any).promptVersion;

    // 2. Create text generation client with API key
    const client = createTextGenerationClient();

    // 3. Get the prompt template for story generation
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
        client.getProviderType(),
        "story",
        promptParams,
        promptVersion,
    );

    console.log(
        "[story-generator] Using generateStructured method with manual schema",
    );

    // 4. Generate story data using structured output method
    const storyData: AiStoryType = await client.generateStructured(
        userPromptText,
        AiStoryZodSchema,
        {
            systemPrompt,
            temperature: 0.3, // Low temperature for consistent JSON structure
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
    const result: GenerateStoryResult = {
        story: storyData,
        metadata: {
            generationTime: Date.now() - startTime,
            model: client.getProviderType(),
        },
    };

    return result;
}

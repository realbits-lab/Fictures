/**
 * Part Generator (Singular)
 *
 * Generates ONE next story part using the Adversity-Triumph Engine.
 * This is the extreme incremental version that generates parts one at a time,
 * with full context of all previous parts.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (service/API layer).
 */

import type {
    GeneratePartParams,
    GeneratePartResult,
    PartPromptParams,
} from "@/lib/schemas/generators/types";
import { type AiPartType, AiPartZodSchema } from "@/lib/schemas/zod/ai";
import { createTextGenerationClient } from "./ai-client";
import {
    buildCharactersContext,
    buildPartsContext,
    buildSettingsContext,
    buildStoryContext,
} from "./context-builders";
import { promptManager } from "./prompt-manager";

/**
 * Generate ONE next story part with full context
 *
 * @param params - Part generation parameters with previous parts
 * @returns Part data (caller responsible for database save)
 */
export async function generatePart(
    params: GeneratePartParams,
): Promise<GeneratePartResult> {
    const startTime: number = Date.now();

    // 1. Extract parameters
    const {
        story,
        characters,
        settings,
        previousParts,
        partIndex,
        promptVersion,
    }: GeneratePartParams = params;

    // 2. Create text generation client with API key
    const client = createTextGenerationClient();

    console.log(
        `[part-generator] 🎬 Generating part ${partIndex + 1} with full context...`,
    );
    console.log(
        `[part-generator] Previous parts count: ${previousParts.length}`,
    );

    // 2. Build context strings using comprehensive builders
    const charactersStr: string = buildCharactersContext(characters);
    const settingsStr: string = buildSettingsContext(settings);
    const storyContext: string = buildStoryContext(story);

    // 3. Build previous parts context string using builder function
    const previousPartsContext: string = buildPartsContext(
        previousParts,
        characters,
    );

    console.log(
        `[part-generator] Context prepared: ${characters.length} characters, ${settings.length} settings`,
    );

    // Get the prompt template for part generation
    const promptParams: PartPromptParams = {
        partNumber: String(partIndex + 1),
        story: storyContext,
        characters: charactersStr,
        settings: settingsStr,
        previousPartsContext,
    };

    const {
        system: systemPrompt,
        user: userPromptText,
    }: { system: string; user: string } = promptManager.getPrompt(
        client.getProviderType(),
        "part",
        promptParams,
        promptVersion, // Pass version for A/B testing
    );

    console.log(
        `[part-generator] Generating part ${partIndex + 1} using structured output with full previous context`,
    );

    // 7. Generate part using structured output
    const partData: AiPartType = await client.generateStructured(
        userPromptText,
        AiPartZodSchema,
        {
            systemPrompt,
            temperature: 0.3, // Low temperature for consistent JSON structure
            maxTokens: 8192,
        },
    );

    // 8. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log(`[part-generator] ✅ Generated part ${partIndex + 1}:`, {
        title: partData.title,
        summary: partData.summary?.substring(0, 50) || "N/A",
        characterArcs: partData.characterArcs?.length || 0,
        generationTime: totalTime,
    });

    // 9. Build and return result with metadata
    const result: GeneratePartResult = {
        part: partData,
        metadata: {
            generationTime: totalTime,
        },
    };

    return result;
}

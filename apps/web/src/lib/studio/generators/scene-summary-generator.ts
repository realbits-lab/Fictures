/**
 * Scene Summary Generator (Singular)
 *
 * Generates ONE next scene summary using the Adversity-Triumph Engine.
 * This is the extreme incremental version that generates scene summaries one at a time,
 * with full context of all previous scenes in the chapter.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { createTextGenerationClient } from "./ai-client";
import {
    buildCharactersContext,
    buildPartContext,
    buildScenesContext,
    buildSettingsContext,
    buildStoryContext,
} from "./context-builders";
import { promptManager } from "./prompt-manager";
import type {
    CyclePhase,
    GeneratorSceneSummaryParams,
    GeneratorSceneSummaryResult,
    SceneSummaryPromptParams,
} from "./types";
import {
    type AiSceneSummaryType,
    AiSceneSummaryZodSchema,
} from "./zod-schemas";

/**
 * Generate ONE next scene summary with full context
 *
 * @param params - Scene summary generation parameters with previous scenes context
 * @returns Scene summary data (caller responsible for database save)
 */
export async function generateSceneSummary(
    params: GeneratorSceneSummaryParams,
): Promise<GeneratorSceneSummaryResult> {
    const startTime = Date.now();

    // 1. Extract parameters
    const {
        story,
        part,
        chapter,
        characters,
        settings,
        previousScenes,
        sceneIndex,
        apiKey,
    }: GeneratorSceneSummaryParams = params;

    // 2. Create text generation client with API key
    const client = createTextGenerationClient(apiKey);

    console.log(
        `[scene-summary-generator] 📄 Generating scene ${sceneIndex + 1} (Chapter: ${chapter.title})...`,
    );
    console.log(
        `[scene-summary-generator] Previous scenes count: ${previousScenes.length}`,
    );

    // 2. Determine cycle phase
    const cyclePhases: CyclePhase[] = [
        "setup",
        "confrontation",
        "virtue",
        "consequence",
        "transition",
    ];
    const cyclePhase =
        cyclePhases[Math.min(sceneIndex, cyclePhases.length - 1)];

    console.log(`[scene-summary-generator] Cycle phase: ${cyclePhase}`);

    // 3. Build context strings using common builders
    const storyContext: string = buildStoryContext(story);
    const partContext: string = buildPartContext(part, characters);
    const chapterContext: string = `Title: ${chapter.title || "Untitled Chapter"}
Summary: ${chapter.summary || "N/A"}
Arc Position: ${chapter.arcPosition || "N/A"}
Adversity Type: ${chapter.adversityType || "N/A"}
Virtue Type: ${chapter.virtueType || "N/A"}`;
    const charactersStr: string = buildCharactersContext(characters);
    const settingsStr: string = buildSettingsContext(settings);

    console.log(
        `[scene-summary-generator] Context prepared: ${characters.length} characters, ${settings.length} settings`,
    );

    // 8. Build previous scenes context string using builder function
    const previousScenesContext: string = buildScenesContext(previousScenes);

    console.log(
        `[scene-summary-generator] Previous scenes context prepared (${previousScenesContext.length} characters)`,
    );

    // 9. Get the prompt template for scene summary generation
    const promptParams: SceneSummaryPromptParams = {
        sceneNumber: String(sceneIndex + 1),
        sceneCount: String(5), // Standard 5 scenes per chapter
        story: storyContext,
        part: partContext,
        chapter: chapterContext,
        characters: charactersStr,
        settings: settingsStr,
        previousScenesContext,
    };

    const {
        system: systemPrompt,
        user: userPromptText,
    }: { system: string; user: string } = promptManager.getPrompt(
        client.getProviderType(),
        "scene_summary",
        promptParams,
    );

    console.log(
        `[scene-summary-generator] Generating scene summary ${sceneIndex + 1} using structured output with full previous context`,
    );

    // 6. Generate scene summary using structured output
    const sceneData: AiSceneSummaryType = await client.generateStructured(
        userPromptText,
        AiSceneSummaryZodSchema,
        {
            systemPrompt,
            temperature: 0.3, // Low temperature for consistent JSON structure
            maxTokens: 8192,
        },
    );

    // 7. Calculate total generation time
    const totalTime = Date.now() - startTime;

    console.log(
        `[scene-summary-generator] ✅ Generated scene summary ${sceneIndex + 1}:`,
        {
            title: sceneData.title,
            cyclePhase: sceneData.cyclePhase,
            generationTime: totalTime,
        },
    );

    // 8. Build and return result with metadata
    return {
        scene: sceneData,
        metadata: {
            generationTime: totalTime,
        },
    };
}

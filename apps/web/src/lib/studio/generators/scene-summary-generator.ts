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

import type {
    CyclePhase,
    GenerateSceneSummaryParams,
    GenerateSceneSummaryResult,
    SceneSummaryPromptParams,
} from "@/lib/schemas/generators/types";
import {
    type AiSceneSummaryType,
    AiSceneSummaryZodSchema,
} from "@/lib/schemas/zod/ai";
import { createTextGenerationClient } from "./ai-client";
import {
    buildCharactersContext,
    buildPartContext,
    buildScenesContext,
    buildSettingsContext,
    buildStoryContext,
} from "./context-builders";
import { promptManager } from "./prompt-manager";

/**
 * Generate ONE next scene summary with full context
 *
 * @param params - Scene summary generation parameters with previous scenes context
 * @returns Scene summary data (caller responsible for database save)
 */
export async function generateSceneSummary(
    params: GenerateSceneSummaryParams,
): Promise<GenerateSceneSummaryResult> {
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
        promptVersion,
    }: GenerateSceneSummaryParams = params;

    // 2. Create text generation client with API key
    const client = createTextGenerationClient();

    console.log(
        `[scene-summary-generator] 📄 Generating scene ${sceneIndex + 1} (Chapter: ${chapter.title})...`,
    );
    console.log(
        `[scene-summary-generator] Previous scenes count: ${previousScenes.length}`,
    );

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
        promptVersion !== "v1.0" ? promptVersion : undefined,
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

    // 7. Validate cycle phase ordering based on previous scenes
    const phaseOrder: CyclePhase[] = [
        "setup",
        "adversity",
        "virtue",
        "consequence",
        "transition",
    ];

    // 7.1. Get previous scene's phase (or null if first scene)
    const previousPhase: CyclePhase | null =
        previousScenes.length > 0
            ? previousScenes[previousScenes.length - 1].cyclePhase
            : null;

    const aiPhaseIndex = phaseOrder.indexOf(sceneData.cyclePhase);

    // 7.2. Validate first scene must be "setup"
    if (sceneIndex === 0) {
        if (sceneData.cyclePhase !== "setup") {
            console.warn(
                `[scene-summary-generator] ⚠️ First scene must be "setup", but AI generated "${sceneData.cyclePhase}". Correcting to "setup".`,
            );
            sceneData.cyclePhase = "setup";
        } else {
            console.log(
                `[scene-summary-generator] ✓ First scene correctly set to "setup"`,
            );
        }
    }
    // 7.3. Validate subsequent scenes follow ordering (same phase or later, no backwards)
    else if (previousPhase) {
        const prevPhaseIndex = phaseOrder.indexOf(previousPhase);

        if (aiPhaseIndex < prevPhaseIndex) {
            console.warn(
                `[scene-summary-generator] ⚠️ AI-generated cyclePhase "${sceneData.cyclePhase}" goes backwards from previous scene's "${previousPhase}". Keeping previous phase.`,
            );
            sceneData.cyclePhase = previousPhase; // Stay at same phase instead of going backwards
        } else if (aiPhaseIndex === prevPhaseIndex) {
            console.log(
                `[scene-summary-generator] ✓ Scene ${sceneIndex + 1} continues with "${sceneData.cyclePhase}" (same as previous)`,
            );
        } else {
            console.log(
                `[scene-summary-generator] ✓ Scene ${sceneIndex + 1} advances to "${sceneData.cyclePhase}" (from "${previousPhase}")`,
            );
        }
    }

    // 8. Calculate total generation time
    const totalTime = Date.now() - startTime;

    console.log(
        `[scene-summary-generator] ✅ Generated scene summary ${sceneIndex + 1}:`,
        {
            title: sceneData.title,
            cyclePhase: sceneData.cyclePhase,
            previousPhase: previousPhase || "none (first scene)",
            generationTime: totalTime,
        },
    );

    // 9. Build and return result with metadata
    return {
        scene: sceneData,
        metadata: {
            generationTime: totalTime,
        },
    };
}

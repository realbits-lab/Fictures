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

import { textGenerationClient } from "./ai-client";
import { promptManager } from "./prompt-manager";
import type {
    CyclePhase,
    GenerateSceneSummaryParams,
    GenerateSceneSummaryResult,
    SceneSummaryPromptParams,
} from "./types";
import {
    type GeneratedSceneSummaryData,
    GeneratedSceneSummarySchema,
} from "./zod-schemas.generated";

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
        chapter,
        settings,
        previousScenes,
        sceneIndex,
        globalSceneIndex,
    }: GenerateSceneSummaryParams = params;

    console.log(
        `[scene-summary-generator] 📄 Generating scene ${globalSceneIndex + 1} (Chapter: ${chapter.title}, Local index: ${sceneIndex + 1})...`,
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

    // 3. Build settings string
    const settingsStr = settings
        .map((s, idx) => `${idx + 1}. ${s.name}: ${s.summary}`)
        .join("\n");

    // 4. Build previous scenes context string (FULL CONTEXT with FULL CONTENT)
    const previousScenesContext: string =
        previousScenes.length > 0
            ? previousScenes
                  .map((scene, idx) => {
                      return `Scene ${idx + 1}: ${scene.title}
Phase: ${scene.cyclePhase || "N/A"}
Summary: ${scene.summary || "N/A"}
Content: ${scene.content ? scene.content.substring(0, 500) : "Not yet generated"}...
Emotional Beat: ${scene.emotionalBeat || "N/A"}`;
                  })
                  .join("\n\n")
            : "None (this is the first scene)";

    console.log(
        `[scene-summary-generator] Previous scenes context prepared (${previousScenesContext.length} characters)`,
    );

    // 5. Get the prompt template for scene summary generation
    const promptParams: SceneSummaryPromptParams = {
        sceneNumber: String(sceneIndex + 1),
        sceneCount: String(5), // Standard 5 scenes per chapter
        chapterTitle: chapter.title,
        chapterSummary: chapter.summary ?? "Chapter summary not available",
        cyclePhase,
        settings: settingsStr,
        previousScenesContext,
    };

    const {
        system: systemPrompt,
        user: userPromptText,
    }: { system: string; user: string } = promptManager.getPrompt(
        textGenerationClient.getProviderType(),
        "scene_summary",
        promptParams,
    );

    console.log(
        `[scene-summary-generator] Generating scene summary ${globalSceneIndex + 1} using structured output with full previous context`,
    );

    // 6. Generate scene summary using structured output
    const sceneData: GeneratedSceneSummaryData =
        await textGenerationClient.generateStructured(
            userPromptText,
            GeneratedSceneSummarySchema,
            {
                systemPrompt,
                temperature: 0.8,
                maxTokens: 8192,
            },
        );

    // 7. Calculate total generation time
    const totalTime = Date.now() - startTime;

    console.log(
        `[scene-summary-generator] ✅ Generated scene summary ${globalSceneIndex + 1}:`,
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

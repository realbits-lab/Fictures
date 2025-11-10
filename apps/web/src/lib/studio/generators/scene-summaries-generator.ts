/**
 * Scene Summaries Generator
 *
 * Generates scene summaries using the Adversity-Triumph Engine.
 * This is the sixth phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "./ai-client";
import { promptManager } from "./prompt-manager";
import type {
    CyclePhase,
    GenerateSceneSummariesParams,
    GenerateSceneSummariesResult,
    SceneSummaryPromptParams,
} from "./types";
import {
    type GeneratedSceneSummaryData,
    GeneratedSceneSummarySchema,
} from "./zod-schemas.generated";

/**
 * Generate scene summaries for all chapters
 *
 * @param params - Scene summaries generation parameters
 * @returns Scene summaries data (caller responsible for database save)
 */
export async function generateSceneSummaries(
    params: GenerateSceneSummariesParams,
): Promise<GenerateSceneSummariesResult> {
    const startTime = Date.now();
    const { chapters, settings, scenesPerChapter, onProgress } = params;

    const scenes: GeneratedSceneSummaryData[] = [];
    let sceneIndex = 0;

    for (const chapter of chapters) {
        for (let i = 0; i < scenesPerChapter; i++) {
            sceneIndex++;

            // Report progress
            if (onProgress) {
                onProgress(sceneIndex, chapters.length * scenesPerChapter);
            }

            // Determine cycle phase
            const cyclePhases: CyclePhase[] = [
                "setup",
                "confrontation",
                "virtue",
                "consequence",
                "transition",
            ];
            const cyclePhase = cyclePhases[Math.min(i, cyclePhases.length - 1)];

            // Build settings string
            const settingsStr = settings
                .map((s, idx) => `${idx + 1}. ${s.name}: ${s.summary}`)
                .join("\n");

            // Get the prompt template for scene summary generation
            const promptParams: SceneSummaryPromptParams = {
                sceneNumber: String(i + 1),
                sceneCount: String(scenesPerChapter),
                chapterTitle: chapter.title,
                chapterSummary:
                    chapter.summary ?? "Chapter summary not available",
                cyclePhase,
                settings: settingsStr,
            };

            const {
                system: systemPrompt,
                user: userPromptText,
            }: { system: string; user: string } = promptManager.getPrompt(
                textGenerationClient.getProviderType(),
                "scene_summary",
                promptParams,
            );

            // Generate scene summary using structured output
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

            scenes.push(sceneData);

            console.log(
                `[scene-summaries-generator] Generated scene summary ${sceneIndex}/${chapters.length * scenesPerChapter}:`,
                {
                    title: sceneData.title,
                    cyclePhase: sceneData.cyclePhase,
                },
            );
        }
    }

    console.log("[scene-summaries-generator] All scene summaries generated:", {
        count: scenes.length,
        generationTime: Date.now() - startTime,
    });

    return {
        scenes,
        metadata: {
            totalGenerated: scenes.length,
            generationTime: Date.now() - startTime,
        },
    };
}

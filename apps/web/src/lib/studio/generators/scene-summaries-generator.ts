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
import {
    buildChapterContext,
    buildCharactersContext,
    buildPartContext,
    buildSettingsContext,
    buildStoryContext,
} from "./context-builders";
import { promptManager } from "./prompt-manager";
import type {
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
    const {
        story,
        part,
        chapters,
        characters,
        settings,
        scenesPerChapter,
        onProgress,
    } = params;

    const scenes: GeneratedSceneSummaryData[] = [];
    let sceneIndex = 0;

    // Build context strings once using common builders (used for all scenes)
    const storyContext: string = buildStoryContext(story);
    const partContext: string = buildPartContext(part);
    const charactersStr: string = buildCharactersContext(characters);

    console.log(
        `[scene-summaries-generator] Context prepared: ${characters.length} characters`,
    );

    // Build settings context once (used for all scenes)
    const settingsStr: string = buildSettingsContext(settings);

    for (const chapter of chapters) {
        // Build chapter context for this chapter
        const chapterContext: string = buildChapterContext(chapter);

        for (let i = 0; i < scenesPerChapter; i++) {
            sceneIndex++;

            // Report progress
            if (onProgress) {
                onProgress(sceneIndex, chapters.length * scenesPerChapter);
            }

            // Get the prompt template for scene summary generation
            const promptParams: SceneSummaryPromptParams = {
                sceneNumber: String(i + 1),
                sceneCount: String(scenesPerChapter),
                story: storyContext,
                part: partContext,
                chapter: chapterContext,
                characters: charactersStr,
                settings: settingsStr,
                previousScenesContext: "", // Not available in batch generation
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

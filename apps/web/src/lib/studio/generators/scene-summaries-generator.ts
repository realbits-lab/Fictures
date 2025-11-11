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

    // Build story context once (used for all scenes)
    const storyContext: string = `Title: ${story.title}
Genre: ${story.genre ?? "General Fiction"}
Summary: ${story.summary ?? "A story of adversity and triumph"}
Moral Framework: ${story.moralFramework ?? "Universal human virtues"}`;

    // Build part context once
    const partContext: string = `Title: ${part.title}
Summary: ${part.summary || "N/A"}`;

    // Build characters context once
    const charactersStr: string = characters
        .map((c) => {
            const personality =
                typeof c.personality === "object" && c.personality !== null
                    ? (c.personality as {
                          traits?: string[];
                          values?: string[];
                      })
                    : { traits: [], values: [] };
            const physicalDesc =
                typeof c.physicalDescription === "object" &&
                c.physicalDescription !== null
                    ? (c.physicalDescription as {
                          age?: string;
                          appearance?: string;
                          distinctiveFeatures?: string;
                          style?: string;
                      })
                    : {};
            const voice =
                typeof c.voiceStyle === "object" && c.voiceStyle !== null
                    ? (c.voiceStyle as {
                          tone?: string;
                          vocabulary?: string;
                          quirks?: string[];
                          emotionalRange?: string;
                      })
                    : {};

            return `Character: ${c.name} (${c.isMain ? "Main" : "Supporting"})
  Summary: ${c.summary || "N/A"}
  External Goal: ${c.externalGoal || "N/A"}
  Core Trait: ${c.coreTrait || "N/A"}
  Internal Flaw: ${c.internalFlaw || "N/A"}
  Personality:
    - Traits: ${personality.traits?.join(", ") || "N/A"}
    - Values: ${personality.values?.join(", ") || "N/A"}
  Backstory: ${c.backstory || "N/A"}
  Physical Description:
    - Age: ${physicalDesc.age || "N/A"}
    - Appearance: ${physicalDesc.appearance || "N/A"}
    - Distinctive Features: ${physicalDesc.distinctiveFeatures || "N/A"}
    - Style: ${physicalDesc.style || "N/A"}
  Voice Style:
    - Tone: ${voice.tone || "N/A"}
    - Vocabulary: ${voice.vocabulary || "N/A"}
    - Quirks: ${voice.quirks?.join("; ") || "N/A"}
    - Emotional Range: ${voice.emotionalRange || "N/A"}`;
        })
        .join("\n\n");

    console.log(
        `[scene-summaries-generator] Character list prepared: ${characters.length} characters`,
    );

    for (const chapter of chapters) {
        // Build chapter context for this chapter
        const chapterContext: string = `Title: ${chapter.title}
Summary: ${chapter.summary}
Arc Position: ${chapter.arcPosition || "N/A"}
Adversity Type: ${chapter.adversityType || "N/A"}
Virtue Type: ${chapter.virtueType || "N/A"}`;

        for (let i = 0; i < scenesPerChapter; i++) {
            sceneIndex++;

            // Report progress
            if (onProgress) {
                onProgress(sceneIndex, chapters.length * scenesPerChapter);
            }

            // Build comprehensive settings list string
            const settingsStr: string = settings
                .map((s) => {
                    const sensory =
                        typeof s.sensory === "object" && s.sensory !== null
                            ? (s.sensory as {
                                  sight?: string[];
                                  sound?: string[];
                                  smell?: string[];
                                  touch?: string[];
                                  taste?: string[];
                              })
                            : {};

                    return `Setting: ${s.name} - Summary: ${s.summary || "N/A"} - Mood: ${s.mood || "N/A"} - Emotional Resonance: ${s.emotionalResonance || "N/A"} - Sensory: sight (${sensory.sight?.join(", ") || "N/A"}), sound (${sensory.sound?.join(", ") || "N/A"}), smell (${sensory.smell?.join(", ") || "N/A"}), touch (${sensory.touch?.join(", ") || "N/A"})`;
                })
                .join("\n");

            console.log(
                `[scene-summaries-generator] Settings list prepared: ${settings.length} settings`,
            );

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

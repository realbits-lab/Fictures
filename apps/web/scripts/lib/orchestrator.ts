/**
 * Novel Generation Orchestrator
 *
 * Coordinates all 9 phases of novel generation using the Adversity-Triumph Engine.
 * Streams progress updates via callback function.
 */

import { GENRE, type StoryGenre } from "@/lib/constants/genres";
import type { StoryTone } from "@/lib/constants/tones";
import type {
    GeneratorChapterParams,
    GeneratorChapterResult,
    GeneratorCharactersParams,
    GeneratorCharactersResult,
    GeneratorPartParams,
    GeneratorPartResult,
    GeneratorSceneContentParams,
    GeneratorSceneContentResult,
    GeneratorSceneImprovementParams,
    GeneratorSceneImprovementResult,
    GeneratorSceneSummaryParams,
    GeneratorSceneSummaryResult,
    GeneratorSettingsParams,
    GeneratorSettingsResult,
    GeneratorStoryParams,
    GeneratorStoryResult,
} from "@/lib/schemas/services/generators";
import type {
    AiChapterType,
    AiCharacterType,
    AiPartType,
    AiSceneSummaryType,
    AiSettingType,
    Story,
} from "@/lib/schemas/zod/ai";
import {
    generateCharacters,
    generateSceneContent,
    generateSettings,
    generateStory,
} from "./generators";
import { generateChapter } from "./generators/chapter-generator";
import { generatePart } from "./generators/part-generator";
import { improveScene } from "./generators/scene-improvement-generator";
import { generateSceneSummary } from "./generators/scene-summary-generator";

/**
 * Generate Novel Parameters
 */
export interface GenerateNovelParams {
    userPrompt: string;
    preferredGenre?: StoryGenre;
    preferredTone?: StoryTone;
    characterCount?: number; // Default: 3
    settingCount?: number; // Default: 3
    partsCount?: number; // Default: 1
    chaptersPerPart?: number; // Default: 1
    scenesPerChapter?: number; // Default: 3
    language?: string; // Default: 'English'
    skipImages?: boolean; // Default: false (for testing without image generation)
    enableSceneEvaluation?: boolean; // Default: false (enable scene quality evaluation)
    maxEvaluationIterations?: number; // Default: 2 (max improvement iterations per scene)
}

/**
 * Progress Callback Data
 */
export interface ProgressData {
    phase:
        | "story_start"
        | "story_complete"
        | "characters_start"
        | "characters_progress"
        | "characters_complete"
        | "settings_start"
        | "settings_progress"
        | "settings_complete"
        | "parts_start"
        | "parts_progress"
        | "parts_complete"
        | "chapters_start"
        | "chapters_progress"
        | "chapters_complete"
        | "scene_summaries_start"
        | "scene_summaries_progress"
        | "scene_summaries_complete"
        | "scene_content_start"
        | "scene_content_progress"
        | "scene_content_complete"
        | "scene_evaluation_start"
        | "scene_evaluation_progress"
        | "scene_evaluation_complete"
        | "images_start"
        | "images_progress"
        | "images_complete"
        | "complete"
        | "error";
    message: string;
    data?: {
        story?: Story;
        characters?: (AiCharacterType & { id: string })[];
        settings?: (AiSettingType & { id: string })[];
        parts?: (AiPartType & { id: string })[];
        chapters?: (AiChapterType & { id: string; partId: string })[];
        scenes?: (AiSceneSummaryType & {
            id: string;
            chapterId: string;
        })[];
        currentItem?: number;
        totalItems?: number;
    };
}

/**
 * Generated Novel Result
 */
export interface GeneratedNovelResult {
    story: Story;
    characters: (AiCharacterType & { id: string })[];
    settings: (AiSettingType & { id: string })[];
    parts: (AiPartType & { id: string })[];
    chapters: (AiChapterType & { id: string; partId: string })[];
    scenes: (AiSceneSummaryType & {
        id: string;
        chapterId: string;
        content: string;
    })[];
}

/**
 * Main Orchestrator Function
 */
export async function generateCompleteNovel(
    options: GenerateNovelParams,
    onProgress: (progress: ProgressData) => void,
): Promise<GeneratedNovelResult> {
    const {
        userPrompt,
        preferredGenre = "Slice", // Default to Slice of Life genre
        preferredTone = "hopeful",
        characterCount = 3,
        settingCount = 3,
        partsCount = 1,
        chaptersPerPart = 1,
        scenesPerChapter = 3,
        language = "English",
        skipImages: _skipImages = false,
        enableSceneEvaluation = false,
        maxEvaluationIterations = 2,
    } = options;

    try {
        // 1. Generate story foundation (Phase 1 of 9)
        onProgress({
            phase: "story_start",
            message: "Generating story foundation...",
        });

        const storyParams: GeneratorStoryParams = {
            userPrompt,
            language,
            preferredGenre,
            preferredTone,
        };

        const storyResult: GeneratorStoryResult =
            await generateStory(storyParams);

        onProgress({
            phase: "story_complete",
            message: "Story foundation generated",
            data: { story: storyResult.story },
        });

        // 2. Generate character profiles (Phase 2 of 9)
        onProgress({
            phase: "characters_start",
            message: `Generating ${characterCount} characters...`,
        });

        const charactersParams: GeneratorCharactersParams = {
            story: storyResult.story,
            characterCount,
            language,
            onProgress: (current: number, total: number) => {
                onProgress({
                    phase: "characters_progress",
                    message: `Generating character ${current}/${total}...`,
                    data: { currentItem: current, totalItems: total },
                });
            },
        };

        const charactersResult: GeneratorCharactersResult =
            await generateCharacters(charactersParams);

        // Add temporary IDs to characters for orchestrator mode
        const charactersWithIds = charactersResult.characters.map((c, idx) => ({
            ...c,
            id: `character_${idx + 1}`,
        }));

        onProgress({
            phase: "characters_complete",
            message: `Generated ${charactersWithIds.length} characters`,
            data: { characters: charactersWithIds },
        });

        // 3. Generate story settings (Phase 3 of 9)
        onProgress({
            phase: "settings_start",
            message: `Generating ${settingCount} settings...`,
        });

        const settingsParams: GeneratorSettingsParams = {
            story: storyResult.story,
            settingCount,
            onProgress: (current: number, total: number) => {
                onProgress({
                    phase: "settings_progress",
                    message: `Generating setting ${current}/${total}...`,
                    data: { currentItem: current, totalItems: total },
                });
            },
        };

        const settingsResult: GeneratorSettingsResult =
            await generateSettings(settingsParams);

        // Add temporary IDs to settings for orchestrator mode
        const settingsWithIds = settingsResult.settings.map((s, idx) => ({
            ...s,
            id: `setting_${idx + 1}`,
        }));

        onProgress({
            phase: "settings_complete",
            message: `Generated ${settingsWithIds.length} settings`,
            data: { settings: settingsWithIds },
        });

        // 4. Generate story parts incrementally (Phase 4 of 9)
        onProgress({
            phase: "parts_start",
            message: `Generating ${partsCount} parts...`,
        });

        const partsWithIds: (AiPartType & { id: string })[] = [];
        for (let i = 0; i < partsCount; i++) {
            onProgress({
                phase: "parts_progress",
                message: `Generating part ${i + 1}/${partsCount}...`,
                data: { currentItem: i + 1, totalItems: partsCount },
            });

            const partParams: GeneratorPartParams = {
                story: storyResult.story,
                characters: charactersWithIds,
                settings: settingsWithIds,
                previousParts: partsWithIds,
                partIndex: i,
            };

            const partResult: GeneratorPartResult =
                await generatePart(partParams);

            // Add temporary ID for orchestrator mode
            partsWithIds.push({
                ...partResult.part,
                id: `part_${i + 1}`,
            });
        }

        onProgress({
            phase: "parts_complete",
            message: `Generated ${partsWithIds.length} parts`,
            data: { parts: partsWithIds },
        });

        // 5. Generate chapters incrementally (Phase 5 of 9)
        onProgress({
            phase: "chapters_start",
            message: "Generating chapters...",
        });

        const chaptersWithIds: (AiChapterType & {
            id: string;
            partId: string;
        })[] = [];
        const totalChapters = partsWithIds.length * chaptersPerPart;

        for (const part of partsWithIds) {
            // Generate chapters for this part
            for (let i = 0; i < chaptersPerPart; i++) {
                const chapterIndex = chaptersWithIds.length;

                onProgress({
                    phase: "chapters_progress",
                    message: `Generating chapter ${chapterIndex + 1}/${totalChapters}...`,
                    data: {
                        currentItem: chapterIndex + 1,
                        totalItems: totalChapters,
                    },
                });

                const chapterParams: GeneratorChapterParams = {
                    story: storyResult.story,
                    part,
                    characters: charactersWithIds,
                    settings: settingsWithIds,
                    previousChapters: chaptersWithIds,
                    chapterIndex,
                };

                const chapterResult: GeneratorChapterResult =
                    await generateChapter(chapterParams);

                // Add temporary ID and partId for orchestrator mode
                chaptersWithIds.push({
                    ...chapterResult.chapter,
                    id: `chapter_${chapterIndex + 1}`,
                    partId: part.id,
                });
            }
        }

        onProgress({
            phase: "chapters_complete",
            message: `Generated ${chaptersWithIds.length} chapters`,
            data: { chapters: chaptersWithIds },
        });

        // 6. Generate scene summaries incrementally (Phase 6 of 9)
        onProgress({
            phase: "scene_summaries_start",
            message: "Generating scene summaries...",
        });

        // Build chapter-to-scene mapping as we generate
        const chapterSceneMap = new Map<
            string,
            (AiSceneSummaryType & { id: string; chapterId: string })[]
        >();
        const allSceneSummaries: (AiSceneSummaryType & {
            id: string;
            chapterId: string;
        })[] = [];
        const totalScenes = chaptersWithIds.length * scenesPerChapter;

        for (const chapter of chaptersWithIds) {
            const chapterScenes: (AiSceneSummaryType & {
                id: string;
                chapterId: string;
            })[] = [];

            // Find the part for this chapter
            const chapterPart = partsWithIds.find(
                (p) => p.id === chapter.partId,
            );
            if (!chapterPart) {
                throw new Error(`Part not found for chapter: ${chapter.id}`);
            }

            // Generate scenes for this chapter
            for (let i = 0; i < scenesPerChapter; i++) {
                const sceneIndex = allSceneSummaries.length;

                onProgress({
                    phase: "scene_summaries_progress",
                    message: `Generating scene summary ${sceneIndex + 1}/${totalScenes}...`,
                    data: {
                        currentItem: sceneIndex + 1,
                        totalItems: totalScenes,
                    },
                });

                const sceneSummaryParams: GeneratorSceneSummaryParams = {
                    story: storyResult.story,
                    part: chapterPart,
                    chapter,
                    characters: charactersWithIds,
                    settings: settingsWithIds,
                    previousScenes: allSceneSummaries,
                    sceneIndex,
                };

                const sceneSummaryResult: GeneratorSceneSummaryResult =
                    await generateSceneSummary(sceneSummaryParams);

                // Add temporary ID and chapterId for orchestrator mode
                const sceneWithIds = {
                    ...sceneSummaryResult.scene,
                    id: `scene_${sceneIndex + 1}`,
                    chapterId: chapter.id,
                };

                chapterScenes.push(sceneWithIds);
                allSceneSummaries.push(sceneWithIds);
            }

            chapterSceneMap.set(chapter.id, chapterScenes);
        }

        onProgress({
            phase: "scene_summaries_complete",
            message: `Generated ${allSceneSummaries.length} scene summaries`,
        });

        // 7. Generate scene content (Phase 7 of 9)
        onProgress({
            phase: "scene_content_start",
            message: "Generating scene content...",
        });

        const scenes: (AiSceneSummaryType & {
            id: string;
            chapterId: string;
            content: string;
        })[] = [];
        let sceneIndex = 0;

        for (const chapter of chaptersWithIds) {
            const chapterScenes:
                | (AiSceneSummaryType & {
                      id: string;
                      chapterId: string;
                  })[]
                | undefined = chapterSceneMap.get(chapter.id);

            if (!chapterScenes) {
                continue;
            }

            for (const sceneSummary of chapterScenes) {
                sceneIndex++;
                onProgress({
                    phase: "scene_content_progress",
                    message: `Generating scene content ${sceneIndex}/${allSceneSummaries.length}...`,
                    data: {
                        currentItem: sceneIndex,
                        totalItems: allSceneSummaries.length,
                    },
                });

                // 7.1. Find the part for this chapter
                const chapterPart: (AiPartType & { id: string }) | undefined =
                    partsWithIds.find((p) => p.id === chapter.partId);

                if (!chapterPart) {
                    throw new Error(
                        `Part not found for chapter: ${chapter.id}`,
                    );
                }

                // 7.2. Generate content for this scene using common generator
                const sceneContentParams: GeneratorSceneContentParams = {
                    sceneId: `scene_${sceneIndex}`,
                    story: storyResult.story,
                    part: chapterPart,
                    chapter,
                    characters: charactersWithIds,
                    settings: settingsWithIds,
                    scene: sceneSummary,
                    language,
                };

                const sceneContentResult: GeneratorSceneContentResult =
                    await generateSceneContent(sceneContentParams);

                const sceneWithContent: AiSceneSummaryType & {
                    id: string;
                    chapterId: string;
                    content: string;
                } = {
                    ...sceneSummary,
                    content: sceneContentResult.content,
                };

                scenes.push(sceneWithContent);
            }
        }

        onProgress({
            phase: "scene_content_complete",
            message: `Generated ${scenes.length} scenes with content`,
        });

        // 8. Scene evaluation (Phase 8 of 9)
        if (enableSceneEvaluation) {
            onProgress({
                phase: "scene_evaluation_start",
                message: "Evaluating and improving scene quality...",
            });

            const evaluatedScenes: (AiSceneSummaryType & {
                id: string;
                chapterId: string;
                content: string;
            })[] = [];
            let evaluatedCount = 0;

            for (const scene of scenes) {
                evaluatedCount++;
                onProgress({
                    phase: "scene_evaluation_progress",
                    message: `Evaluating scene ${evaluatedCount}/${scenes.length}...`,
                    data: {
                        currentItem: evaluatedCount,
                        totalItems: scenes.length,
                    },
                });

                // 8.1. Improve scene using pure generator (no DB save in orchestrator)
                const improvementParams: GeneratorSceneImprovementParams = {
                    content: scene.content || "",
                    story: {
                        id: storyResult.story.id || "story_temp",
                        title: storyResult.story.title || "Untitled",
                        genre: (storyResult.story.genre ||
                            GENRE.SLICE) as import("@/lib/constants/genres").StoryGenre,
                        moralFramework:
                            storyResult.story.moralFramework || "courage",
                        summary: storyResult.story.summary || "",
                        tone: (storyResult.story.tone ||
                            "hopeful") as import("@/lib/constants/tones").StoryTone,
                    },
                    maxIterations: maxEvaluationIterations,
                };

                const improvementResult: GeneratorSceneImprovementResult =
                    await improveScene(improvementParams);

                // 8.2. Update scene with improved content
                const evaluatedScene: AiSceneSummaryType & {
                    id: string;
                    chapterId: string;
                    content: string;
                } = {
                    ...scene,
                    content: improvementResult.finalContent,
                };

                evaluatedScenes.push(evaluatedScene);

                console.log(
                    `[Orchestrator] Scene ${evaluatedCount}/${scenes.length} improved:`,
                    {
                        score: improvementResult.score,
                        iterations: improvementResult.iterations,
                        improved: improvementResult.improved,
                    },
                );
            }

            onProgress({
                phase: "scene_evaluation_complete",
                message: `Evaluated ${evaluatedScenes.length} scenes`,
            });

            // Replace scenes with evaluated scenes
            scenes.length = 0;
            scenes.push(...evaluatedScenes);
        } else {
            console.log(
                "[Orchestrator] Scene evaluation skipped (enableSceneEvaluation=false)",
            );
        }

        // 9. Return the complete novel
        const result: GeneratedNovelResult = {
            story: storyResult.story,
            characters: charactersWithIds,
            settings: settingsWithIds,
            parts: partsWithIds,
            chapters: chaptersWithIds,
            scenes,
        };

        return result;
    } catch (error) {
        console.error("[Orchestrator] Generation error:", error);
        throw error;
    }
}

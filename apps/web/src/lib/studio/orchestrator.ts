/**
 * Novel Generation Orchestrator
 *
 * Coordinates all 9 phases of novel generation using the Adversity-Triumph Engine.
 * Streams progress updates via callback function.
 */

import { GENRE, type StoryGenre } from "@/lib/constants/genres";
import type { StoryTone } from "@/lib/constants/tones";
import type {
    Chapter,
    Character,
    Part,
    Scene,
    Setting,
    Story,
} from "@/lib/studio/generators/zod-schemas.generated";
import {
    generateChapters,
    generateCharacters,
    generateParts,
    generateSceneContent,
    generateSceneSummaries,
    generateSettings,
    generateStory,
} from "./generators";
import { evaluateScene } from "./generators/scene-evaluation-generator";
import type {
    EvaluateSceneParams,
    EvaluateSceneResult,
    GenerateChaptersParams,
    GenerateChaptersResult,
    GenerateCharactersParams,
    GenerateCharactersResult,
    GeneratePartsParams,
    GeneratePartsResult,
    GenerateSceneContentParams,
    GenerateSceneContentResult,
    GenerateSceneSummariesParams,
    GenerateSceneSummariesResult,
    GenerateSettingsParams,
    GenerateSettingsResult,
    GenerateStoryParams,
    GenerateStoryResult,
} from "./generators/types";

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
        story?: Partial<Story>;
        characters?: Partial<Character>[];
        settings?: Partial<Setting>[];
        parts?: Partial<Part>[];
        chapters?: Partial<Chapter>[];
        scenes?: Partial<Scene>[];
        currentItem?: number;
        totalItems?: number;
    };
}

/**
 * Generated Novel Result
 */
export interface GeneratedNovelResult {
    story: Partial<Story>;
    characters: Partial<Character>[];
    settings: Partial<Setting>[];
    parts: Partial<Part>[];
    chapters: Partial<Chapter>[];
    scenes: Partial<Scene>[];
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

        const storyParams: GenerateStoryParams = {
            userPrompt,
            language,
            preferredGenre,
            preferredTone,
        };

        const storyResult: GenerateStoryResult =
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

        const charactersParams: GenerateCharactersParams = {
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

        const charactersResult: GenerateCharactersResult =
            await generateCharacters(charactersParams);

        onProgress({
            phase: "characters_complete",
            message: `Generated ${charactersResult.characters.length} characters`,
            data: { characters: charactersResult.characters },
        });

        // 3. Generate story settings (Phase 3 of 9)
        onProgress({
            phase: "settings_start",
            message: `Generating ${settingCount} settings...`,
        });

        const settingsParams: GenerateSettingsParams = {
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

        const settingsResult: GenerateSettingsResult =
            await generateSettings(settingsParams);

        onProgress({
            phase: "settings_complete",
            message: `Generated ${settingsResult.settings.length} settings`,
            data: { settings: settingsResult.settings },
        });

        // 4. Generate story parts (Phase 4 of 9)
        onProgress({
            phase: "parts_start",
            message: `Generating ${partsCount} parts...`,
        });

        const partsParams: GeneratePartsParams = {
            story: storyResult.story,
            characters: charactersResult.characters,
            settings: settingsResult.settings,
            partsCount,
            onProgress: (current: number, total: number) => {
                onProgress({
                    phase: "parts_progress",
                    message: `Generating part ${current}/${total}...`,
                    data: { currentItem: current, totalItems: total },
                });
            },
        };

        const partsResult: GeneratePartsResult =
            await generateParts(partsParams);

        // Assign temporary IDs to parts for orchestrator mode
        const partsWithIds = partsResult.parts.map((part, idx) => ({
            ...part,
            id: `part_${idx + 1}`,
        }));

        onProgress({
            phase: "parts_complete",
            message: `Generated ${partsWithIds.length} parts`,
            data: { parts: partsWithIds },
        });

        // 5. Generate chapters (Phase 5 of 9)
        onProgress({
            phase: "chapters_start",
            message: "Generating chapters...",
        });

        const chaptersParams: GenerateChaptersParams = {
            storyId: "", // Not needed for orchestrator (no DB save)
            story: storyResult.story,
            parts: partsWithIds,
            characters: charactersResult.characters,
            chaptersPerPart,
            onProgress: (current: number, total: number) => {
                onProgress({
                    phase: "chapters_progress",
                    message: `Generating chapter ${current}/${total}...`,
                    data: { currentItem: current, totalItems: total },
                });
            },
        };

        const chaptersResult: GenerateChaptersResult =
            await generateChapters(chaptersParams);

        // Assign temporary IDs and partId to chapters for orchestrator mode
        let chapterIdx = 0;
        const chaptersWithIds = chaptersResult.chapters.map((chapter) => {
            const partIndex = Math.floor(chapterIdx / chaptersPerPart);
            chapterIdx++;
            return {
                ...chapter,
                id: `chapter_${chapterIdx}`,
                partId: partsWithIds[partIndex]?.id || "part_1",
            };
        });

        onProgress({
            phase: "chapters_complete",
            message: `Generated ${chaptersWithIds.length} chapters`,
            data: { chapters: chaptersWithIds },
        });

        // 6. Generate scene summaries (Phase 6 of 9)
        onProgress({
            phase: "scene_summaries_start",
            message: "Generating scene summaries...",
        });

        // 6.1. Get the first part for scene summaries context
        const firstPart: Partial<Part> | undefined = partsResult.parts[0];
        if (!firstPart) {
            throw new Error("No parts generated");
        }

        const sceneSummariesParams: GenerateSceneSummariesParams = {
            story: storyResult.story,
            part: firstPart,
            chapters: chaptersWithIds,
            characters: charactersResult.characters,
            settings: settingsResult.settings,
            scenesPerChapter,
            onProgress: (current: number, total: number) => {
                onProgress({
                    phase: "scene_summaries_progress",
                    message: `Generating scene summary ${current}/${total}...`,
                    data: { currentItem: current, totalItems: total },
                });
            },
        };

        const sceneSummariesResult: GenerateSceneSummariesResult =
            await generateSceneSummaries(sceneSummariesParams);

        // 6.1. Build chapter-to-scene mapping for later use
        const chapterSceneMap = new Map<string, Partial<Scene>[]>();
        let sceneIdx = 0;
        for (const chapter of chaptersWithIds) {
            const chapSummaries: Partial<Scene>[] =
                sceneSummariesResult.scenes.slice(
                    sceneIdx,
                    sceneIdx + scenesPerChapter,
                );
            chapterSceneMap.set(chapter.id!, chapSummaries);
            sceneIdx += scenesPerChapter;
        }

        onProgress({
            phase: "scene_summaries_complete",
            message: `Generated ${sceneSummariesResult.scenes.length} scene summaries`,
        });

        // 7. Generate scene content (Phase 7 of 9)
        onProgress({
            phase: "scene_content_start",
            message: "Generating scene content...",
        });

        const scenes: Partial<Scene>[] = [];
        let sceneIndex = 0;

        for (const chapter of chaptersWithIds) {
            const chapterScenes: Partial<Scene>[] =
                chapterSceneMap.get(chapter.id!) || [];

            for (const sceneSummary of chapterScenes) {
                sceneIndex++;
                onProgress({
                    phase: "scene_content_progress",
                    message: `Generating scene content ${sceneIndex}/${sceneSummariesResult.scenes.length}...`,
                    data: {
                        currentItem: sceneIndex,
                        totalItems: sceneSummariesResult.scenes.length,
                    },
                });

                // 7.1. Find the part for this chapter
                const chapterPart: Partial<Part> | undefined =
                    partsWithIds.find((p) => p.id === chapter.partId);

                if (!chapterPart) {
                    throw new Error(
                        `Part not found for chapter: ${chapter.id}`,
                    );
                }

                // 7.2. Generate content for this scene using common generator
                const sceneContentParams: GenerateSceneContentParams = {
                    sceneId: `scene_${sceneIndex}`,
                    story: storyResult.story,
                    part: chapterPart,
                    chapter,
                    characters: charactersResult.characters,
                    settings: settingsResult.settings,
                    scene: sceneSummary,
                    language,
                };

                const sceneContentResult: GenerateSceneContentResult =
                    await generateSceneContent(sceneContentParams);

                const sceneWithContent: Partial<Scene> = {
                    id: `scene_${sceneIndex}`,
                    chapterId: chapter.id,
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

            const evaluatedScenes: Partial<Scene>[] = [];
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

                // 8.1. Evaluate scene using pure generator (no DB save in orchestrator)
                const evaluateParams: EvaluateSceneParams = {
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

                const evaluationResult: EvaluateSceneResult =
                    await evaluateScene(evaluateParams);

                // 8.2. Update scene with improved content
                const evaluatedScene: Partial<Scene> = {
                    ...scene,
                    content: evaluationResult.finalContent,
                };

                evaluatedScenes.push(evaluatedScene);

                console.log(
                    `[Orchestrator] Scene ${evaluatedCount}/${scenes.length} evaluated:`,
                    {
                        score: evaluationResult.score,
                        iterations: evaluationResult.iterations,
                        improved: evaluationResult.improved,
                    },
                );
            }

            onProgress({
                phase: "scene_evaluation_complete",
                message: `Evaluated ${evaluatedScenes.length} scenes`,
            });

            // Replace scenes with evaluated scenes
            scenes.length = 0;
            scenes.push(...(evaluatedScenes as Partial<Scene>[]));
        } else {
            console.log(
                "[Orchestrator] Scene evaluation skipped (enableSceneEvaluation=false)",
            );
        }

        // 9. Return the complete novel
        const result: GeneratedNovelResult = {
            story: storyResult.story,
            characters: charactersResult.characters,
            settings: settingsResult.settings,
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

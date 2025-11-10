/**
 * Novel Generation Orchestrator
 *
 * Coordinates all 9 phases of novel generation using the Adversity-Triumph Engine.
 * Streams progress updates via callback function.
 */

import type {
    Chapter,
    Character,
    Part,
    Scene,
    Setting,
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
import type {
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
 * Novel Generation Options
 */
export interface NovelGenerationOptions {
    userPrompt: string;
    preferredGenre?: string;
    preferredTone?: "hopeful" | "dark" | "bittersweet" | "satirical";
    characterCount?: number; // Default: 3
    settingCount?: number; // Default: 3
    partsCount?: number; // Default: 1
    chaptersPerPart?: number; // Default: 1
    scenesPerChapter?: number; // Default: 3
    language?: string; // Default: 'English'
    skipImages?: boolean; // Default: false (for testing without image generation)
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
        story?: GeneratedNovelResult["story"];
        characters?: Character[];
        settings?: Setting[];
        parts?: Part[];
        chapters?: Chapter[];
        scenes?: SceneWithContent[];
        currentItem?: number;
        totalItems?: number;
    };
}

/**
 * Generated Novel Result
 */
export interface GeneratedNovelResult {
    story: {
        title: string;
        genre: string;
        summary: string;
        tone: string;
        moralFramework: string;
    };
    characters: Character[];
    settings: Setting[];
    parts: Part[];
    chapters: Chapter[];
    scenes: SceneWithContent[];
}

interface SceneWithContent extends Scene {
    id: string;
    chapterId: string;
    content: string;
}

/**
 * Main Orchestrator Function
 */
export async function generateCompleteNovel(
    options: NovelGenerationOptions,
    onProgress: (progress: ProgressData) => void,
): Promise<GeneratedNovelResult> {
    const {
        userPrompt,
        preferredGenre,
        preferredTone = "hopeful",
        characterCount = 3,
        settingCount = 3,
        partsCount = 1,
        chaptersPerPart = 1,
        scenesPerChapter = 3,
        language = "English",
        skipImages = false,
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

        const charactersParams: Omit<GenerateCharactersParams, "story"> & {
            story: GeneratedNovelResult["story"];
        } = {
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
            await generateCharacters(
                charactersParams as GenerateCharactersParams,
            );

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

        const settingsParams: Omit<GenerateSettingsParams, "story"> & {
            story: GeneratedNovelResult["story"];
        } = {
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

        const settingsResult: GenerateSettingsResult = await generateSettings(
            settingsParams as GenerateSettingsParams,
        );

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

        const partsParams: Omit<GeneratePartsParams, "story"> & {
            story: GeneratedNovelResult["story"];
        } = {
            story: storyResult.story,
            characters: charactersResult.characters,
            partsCount,
            onProgress: (current: number, total: number) => {
                onProgress({
                    phase: "parts_progress",
                    message: `Generating part ${current}/${total}...`,
                    data: { currentItem: current, totalItems: total },
                });
            },
        };

        const partsResult: GeneratePartsResult = await generateParts(
            partsParams as GeneratePartsParams,
        );

        onProgress({
            phase: "parts_complete",
            message: `Generated ${partsResult.parts.length} parts`,
            data: { parts: partsResult.parts },
        });

        // 5. Generate chapters (Phase 5 of 9)
        onProgress({
            phase: "chapters_start",
            message: "Generating chapters...",
        });

        const chaptersParams: Omit<GenerateChaptersParams, "story"> & {
            story: GeneratedNovelResult["story"];
        } = {
            storyId: "", // Not needed for orchestrator (no DB save)
            story: storyResult.story,
            parts: partsResult.parts,
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

        const chaptersResult: GenerateChaptersResult = await generateChapters(
            chaptersParams as GenerateChaptersParams,
        );

        onProgress({
            phase: "chapters_complete",
            message: `Generated ${chaptersResult.chapters.length} chapters`,
            data: { chapters: chaptersResult.chapters },
        });

        // 6. Generate scene summaries (Phase 6 of 9)
        onProgress({
            phase: "scene_summaries_start",
            message: "Generating scene summaries...",
        });

        const sceneSummariesParams: GenerateSceneSummariesParams = {
            chapters: chaptersResult.chapters,
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
        const chapterSceneMap = new Map<string, Scene[]>();
        let sceneIdx = 0;
        for (const chapter of chaptersResult.chapters) {
            const chapSummaries: Scene[] = sceneSummariesResult.scenes.slice(
                sceneIdx,
                sceneIdx + scenesPerChapter,
            );
            chapterSceneMap.set(chapter.id, chapSummaries);
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

        const scenes: SceneWithContent[] = [];
        let sceneIndex = 0;

        for (const chapter of chaptersResult.chapters) {
            const chapterScenes: Scene[] =
                chapterSceneMap.get(chapter.id) || [];

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

                // 7.1. Generate content for this scene using common generator
                const sceneContentParams: GenerateSceneContentParams = {
                    sceneId: `scene_${sceneIndex}`,
                    scene: sceneSummary,
                    characters: charactersResult.characters,
                    settings: settingsResult.settings,
                    language,
                };

                const sceneContentResult: GenerateSceneContentResult =
                    await generateSceneContent(sceneContentParams);

                const sceneWithContent: SceneWithContent = {
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

        // 8. Scene evaluation (Phase 8 of 9) - Optional, can be added later
        // For now, we'll skip evaluation and just return the generated content

        // 9. Return the complete novel
        const result: GeneratedNovelResult = {
            story: storyResult.story,
            characters: charactersResult.characters,
            settings: settingsResult.settings,
            parts: partsResult.parts,
            chapters: chaptersResult.chapters,
            scenes,
        };

        return result;
    } catch (error) {
        console.error("[Orchestrator] Generation error:", error);
        throw error;
    }
}

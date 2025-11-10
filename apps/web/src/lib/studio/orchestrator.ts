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
    } = options;

    try {
        // 1. Generate story foundation (Phase 1 of 9)
        onProgress({
            phase: "story_start",
            message: "Generating story foundation...",
        });

        const storyParams: {
            userPrompt: string;
            language?: string;
            preferredGenre?: string;
            preferredTone?: string;
        } = {
            userPrompt,
            language,
            preferredGenre,
            preferredTone,
        };

        const storyResult = await generateStory(storyParams);

        const storyData: GeneratedNovelResult["story"] = storyResult.story;

        onProgress({
            phase: "story_complete",
            message: "Story foundation generated",
            data: { story: storyData },
        });

        // 2. Generate character profiles (Phase 2 of 9)
        onProgress({
            phase: "characters_start",
            message: `Generating ${characterCount} characters...`,
        });

        const charactersParams: {
            storyId: string;
            story: GeneratedNovelResult["story"];
            characterCount: number;
            language?: string;
            onProgress?: (current: number, total: number) => void;
        } = {
            storyId: "", // Not needed for orchestrator (no DB save)
            story: storyData,
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

        const charactersResult = await generateCharacters(charactersParams);

        const characters: Character[] = charactersResult.characters;

        onProgress({
            phase: "characters_complete",
            message: `Generated ${characters.length} characters`,
            data: { characters },
        });

        // 3. Generate story settings (Phase 3 of 9)
        onProgress({
            phase: "settings_start",
            message: `Generating ${settingCount} settings...`,
        });

        const settingsParams: {
            storyId: string;
            story: GeneratedNovelResult["story"];
            settingCount: number;
            onProgress?: (current: number, total: number) => void;
        } = {
            storyId: "", // Not needed for orchestrator (no DB save)
            story: storyData,
            settingCount,
            onProgress: (current: number, total: number) => {
                onProgress({
                    phase: "settings_progress",
                    message: `Generating setting ${current}/${total}...`,
                    data: { currentItem: current, totalItems: total },
                });
            },
        };

        const settingsResult = await generateSettings(settingsParams);

        const settings: Setting[] = settingsResult.settings;

        onProgress({
            phase: "settings_complete",
            message: `Generated ${settings.length} settings`,
            data: { settings },
        });

        // 4. Generate story parts (Phase 4 of 9)
        onProgress({
            phase: "parts_start",
            message: `Generating ${partsCount} parts...`,
        });

        const partsParams: {
            storyId: string;
            story: GeneratedNovelResult["story"];
            characters: Character[];
            partsCount: number;
            onProgress?: (current: number, total: number) => void;
        } = {
            storyId: "", // Not needed for orchestrator (no DB save)
            story: storyData,
            characters,
            partsCount,
            onProgress: (current: number, total: number) => {
                onProgress({
                    phase: "parts_progress",
                    message: `Generating part ${current}/${total}...`,
                    data: { currentItem: current, totalItems: total },
                });
            },
        };

        const partsResult = await generateParts(partsParams);

        const parts: Part[] = partsResult.parts;

        onProgress({
            phase: "parts_complete",
            message: `Generated ${parts.length} parts`,
            data: { parts },
        });

        // 5. Generate chapters (Phase 5 of 9)
        onProgress({
            phase: "chapters_start",
            message: "Generating chapters...",
        });

        const chaptersParams: {
            storyId: string;
            story: GeneratedNovelResult["story"];
            parts: Part[];
            characters: Character[];
            chaptersPerPart: number;
            onProgress?: (current: number, total: number) => void;
        } = {
            storyId: "", // Not needed for orchestrator (no DB save)
            story: storyData,
            parts,
            characters,
            chaptersPerPart,
            onProgress: (current: number, total: number) => {
                onProgress({
                    phase: "chapters_progress",
                    message: `Generating chapter ${current}/${total}...`,
                    data: { currentItem: current, totalItems: total },
                });
            },
        };

        const chaptersResult = await generateChapters(chaptersParams);

        const chapters: Chapter[] = chaptersResult.chapters;

        onProgress({
            phase: "chapters_complete",
            message: `Generated ${chapters.length} chapters`,
            data: { chapters },
        });

        // 6. Generate scene summaries (Phase 6 of 9)
        onProgress({
            phase: "scene_summaries_start",
            message: "Generating scene summaries...",
        });

        const sceneSummariesParams: {
            chapters: Chapter[];
            settings: Setting[];
            scenesPerChapter: number;
            onProgress?: (current: number, total: number) => void;
        } = {
            chapters,
            settings,
            scenesPerChapter,
            onProgress: (current: number, total: number) => {
                onProgress({
                    phase: "scene_summaries_progress",
                    message: `Generating scene summary ${current}/${total}...`,
                    data: { currentItem: current, totalItems: total },
                });
            },
        };

        const sceneSummariesResult =
            await generateSceneSummaries(sceneSummariesParams);

        const scenesWithSummaries: Scene[] = sceneSummariesResult.scenes;

        // 6.1. Build chapter-to-scene mapping for later use
        const chapterSceneMap = new Map<string, Scene[]>();
        let sceneIdx = 0;
        for (const chapter of chapters) {
            const chapSummaries: Scene[] = scenesWithSummaries.slice(
                sceneIdx,
                sceneIdx + scenesPerChapter,
            );
            chapterSceneMap.set(chapter.id, chapSummaries);
            sceneIdx += scenesPerChapter;
        }

        onProgress({
            phase: "scene_summaries_complete",
            message: `Generated ${scenesWithSummaries.length} scene summaries`,
        });

        // 7. Generate scene content (Phase 7 of 9)
        onProgress({
            phase: "scene_content_start",
            message: "Generating scene content...",
        });

        const scenes: SceneWithContent[] = [];
        let sceneIndex = 0;

        for (const chapter of chapters) {
            const chapterScenes: Scene[] =
                chapterSceneMap.get(chapter.id) || [];

            for (const sceneSummary of chapterScenes) {
                sceneIndex++;
                onProgress({
                    phase: "scene_content_progress",
                    message: `Generating scene content ${sceneIndex}/${scenesWithSummaries.length}...`,
                    data: {
                        currentItem: sceneIndex,
                        totalItems: scenesWithSummaries.length,
                    },
                });

                // 7.1. Generate content for this scene using common generator
                const sceneContentParams: {
                    sceneId: string;
                    scene: Scene;
                    characters: Character[];
                    settings: Setting[];
                    language?: string;
                } = {
                    sceneId: `scene_${sceneIndex}`,
                    scene: sceneSummary,
                    characters,
                    settings,
                    language,
                };

                const sceneContentResult =
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
            story: storyData,
            characters,
            settings,
            parts,
            chapters,
            scenes,
        };

        return result;
    } catch (error) {
        console.error("[Orchestrator] Generation error:", error);
        throw error;
    }
}

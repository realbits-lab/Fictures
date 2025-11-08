/**
 * Novel Generation Orchestrator
 *
 * Coordinates all 9 phases of novel generation using the Adversity-Triumph Engine.
 * Streams progress updates via callback function.
 */

import type {
	ChapterGenerationResult,
	CharacterGenerationResult,
	PartGenerationResult,
	SceneSummaryResult,
	SettingGenerationResult,
} from "@/lib/studio/generators/ai-types";
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
	data?: any;
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
	characters: CharacterGenerationResult[];
	settings: SettingGenerationResult[];
	parts: PartGenerationResult[];
	chapters: ChapterGenerationResult[];
	scenes: SceneWithContent[];
}

interface SceneWithContent extends SceneSummaryResult {
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
		// Phase 1: Generate Story (using common generator)
		onProgress({
			phase: "story_start",
			message: "Generating story foundation...",
		});

		const storyResult = await generateStory({
			userId: "", // Not needed for orchestrator (no DB save)
			userPrompt,
			language,
			preferredGenre,
			preferredTone,
		});

		const storyData = storyResult.story;

		onProgress({
			phase: "story_complete",
			message: "Story foundation generated",
			data: { story: storyData },
		});

		// Phase 2: Generate Characters (using common generator)
		onProgress({
			phase: "characters_start",
			message: `Generating ${characterCount} characters...`,
		});

		const charactersResult = await generateCharacters({
			storyId: "", // Not needed for orchestrator (no DB save)
			userId: "", // Not needed for orchestrator (no DB save)
			story: storyData,
			characterCount,
			language,
			onProgress: (current, total) => {
				onProgress({
					phase: "characters_progress",
					message: `Generating character ${current}/${total}...`,
					data: { currentItem: current, totalItems: total },
				});
			},
		});

		const characters = charactersResult.characters;

		onProgress({
			phase: "characters_complete",
			message: `Generated ${characters.length} characters`,
			data: { characters },
		});

		// Phase 3: Generate Settings (using common generator)
		onProgress({
			phase: "settings_start",
			message: `Generating ${settingCount} settings...`,
		});

		const settingsResult = await generateSettings({
			storyId: "", // Not needed for orchestrator (no DB save)
			userId: "", // Not needed for orchestrator (no DB save)
			story: storyData,
			settingCount,
			language,
			onProgress: (current, total) => {
				onProgress({
					phase: "settings_progress",
					message: `Generating setting ${current}/${total}...`,
					data: { currentItem: current, totalItems: total },
				});
			},
		});

		const settings = settingsResult.settings;

		onProgress({
			phase: "settings_complete",
			message: `Generated ${settings.length} settings`,
			data: { settings },
		});

		// Phase 4: Generate Parts (using common generator)
		onProgress({
			phase: "parts_start",
			message: `Generating ${partsCount} parts...`,
		});

		const partsResult = await generateParts({
			storyId: "", // Not needed for orchestrator (no DB save)
			userId: "", // Not needed for orchestrator (no DB save)
			story: storyData,
			characters,
			settings,
			partsCount,
			language,
			onProgress: (current, total) => {
				onProgress({
					phase: "parts_progress",
					message: `Generating part ${current}/${total}...`,
					data: { currentItem: current, totalItems: total },
				});
			},
		});

		const parts = partsResult.parts;

		onProgress({
			phase: "parts_complete",
			message: `Generated ${parts.length} parts`,
			data: { parts },
		});

		// Phase 5: Generate Chapters (using common generator)
		onProgress({ phase: "chapters_start", message: "Generating chapters..." });

		const chaptersResult = await generateChapters({
			storyId: "", // Not needed for orchestrator (no DB save)
			userId: "", // Not needed for orchestrator (no DB save)
			story: storyData,
			parts,
			characters,
			settings,
			chaptersPerPart,
			language,
			onProgress: (current, total) => {
				onProgress({
					phase: "chapters_progress",
					message: `Generating chapter ${current}/${total}...`,
					data: { currentItem: current, totalItems: total },
				});
			},
		});

		const chapters = chaptersResult.chapters;

		onProgress({
			phase: "chapters_complete",
			message: `Generated ${chapters.length} chapters`,
			data: { chapters },
		});

		// Phase 6: Generate Scene Summaries (using common generator)
		onProgress({
			phase: "scene_summaries_start",
			message: "Generating scene summaries...",
		});

		const sceneSummariesResult = await generateSceneSummaries({
			storyId: "", // Not needed for orchestrator (no DB save)
			userId: "", // Not needed for orchestrator (no DB save)
			story: storyData,
			chapters,
			characters,
			settings,
			scenesPerChapter,
			language,
			onProgress: (current, total) => {
				onProgress({
					phase: "scene_summaries_progress",
					message: `Generating scene summary ${current}/${total}...`,
					data: { currentItem: current, totalItems: total },
				});
			},
		});

		const scenesWithSummaries = sceneSummariesResult.scenes;

		// Build chapter-to-scene mapping for later use
		const chapterSceneMap = new Map<string, SceneSummaryResult[]>();
		let sceneIdx = 0;
		for (const chapter of chapters) {
			const chapSummaries = scenesWithSummaries.slice(
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

		// Phase 7: Generate Scene Content (using common generator)
		onProgress({
			phase: "scene_content_start",
			message: "Generating scene content...",
		});

		const scenes: SceneWithContent[] = [];
		let sceneIndex = 0;

		for (const chapter of chapters) {
			const chapterScenes = chapterSceneMap.get(chapter.id) || [];

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

				// Generate content for this scene using common generator
				const sceneContentResult = await generateSceneContent({
					sceneId: `scene_${sceneIndex}`,
					userId: "", // Not needed for orchestrator (no DB save)
					scene: sceneSummary,
					chapter,
					story: storyData,
					characters,
					settings,
					language,
				});

				scenes.push({
					id: `scene_${sceneIndex}`,
					chapterId: chapter.id,
					...sceneSummary,
					content: sceneContentResult.content,
				});
			}
		}

		onProgress({
			phase: "scene_content_complete",
			message: `Generated ${scenes.length} scenes with content`,
		});

		// Phase 8: Scene Evaluation (Optional - can be added later)
		// For now, we'll skip evaluation and just return the generated content

		// Return the complete novel
		return {
			story: storyData,
			characters,
			settings,
			parts,
			chapters,
			scenes,
		};
	} catch (error) {
		console.error("[Orchestrator] Generation error:", error);
		throw error;
	}
}

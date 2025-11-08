/**
 * Common types for all generators
 */

import type {
	Chapter,
	Character,
	Part,
	Scene,
	Setting,
	StorySummaryResult,
} from "./ai-types";

// ============================================================================
// Base Generator Interfaces
// ============================================================================

export interface GeneratorMetadata {
	generationTime: number;
	model?: string;
}

export interface GeneratorResult<T> {
	data: T;
	metadata: GeneratorMetadata;
}

export type ProgressCallback = (current: number, total: number) => void;

// ============================================================================
// Story Generator
// ============================================================================

export interface GenerateStoryParams {
	userId: string;
	userPrompt: string;
	language?: string;
	preferredGenre?: string;
	preferredTone?: string;
}

export interface GenerateStoryResult {
	story: StorySummaryResult;
	storyId: string;
	metadata: GeneratorMetadata;
}

// ============================================================================
// Characters Generator
// ============================================================================

export interface GenerateCharactersParams {
	storyId: string;
	userId: string;
	story: StorySummaryResult;
	characterCount: number;
	language?: string;
	onProgress?: ProgressCallback;
}

export interface GenerateCharactersResult {
	characters: Character[];
	metadata: {
		totalGenerated: number;
		generationTime: number;
	};
}

// ============================================================================
// Settings Generator
// ============================================================================

export interface GenerateSettingsParams {
	storyId: string;
	userId: string;
	story: StorySummaryResult;
	settingCount: number;
	language?: string;
	onProgress?: ProgressCallback;
}

export interface GenerateSettingsResult {
	settings: Setting[];
	metadata: {
		totalGenerated: number;
		generationTime: number;
	};
}

// ============================================================================
// Parts Generator
// ============================================================================

export interface GeneratePartsParams {
	storyId: string;
	userId: string;
	story: StorySummaryResult;
	characters: Character[];
	settings: Setting[];
	partsCount: number;
	language?: string;
	onProgress?: ProgressCallback;
}

export interface GeneratePartsResult {
	parts: Part[];
	metadata: {
		totalGenerated: number;
		generationTime: number;
	};
}

// ============================================================================
// Chapters Generator
// ============================================================================

export interface GenerateChaptersParams {
	storyId: string;
	userId: string;
	story: StorySummaryResult;
	parts: Part[];
	characters: Character[];
	settings: Setting[];
	chaptersPerPart: number;
	language?: string;
	onProgress?: ProgressCallback;
}

export interface GenerateChaptersResult {
	chapters: Chapter[];
	metadata: {
		totalGenerated: number;
		generationTime: number;
	};
}

// ============================================================================
// Scene Summaries Generator
// ============================================================================

export interface GenerateSceneSummariesParams {
	storyId: string;
	userId: string;
	story: StorySummaryResult;
	chapters: Chapter[];
	characters: Character[];
	settings: Setting[];
	scenesPerChapter: number;
	language?: string;
	onProgress?: ProgressCallback;
}

export interface GenerateSceneSummariesResult {
	scenes: Scene[];
	metadata: {
		totalGenerated: number;
		generationTime: number;
	};
}

// ============================================================================
// Scene Content Generator
// ============================================================================

export interface GenerateSceneContentParams {
	sceneId: string;
	userId: string;
	scene: Scene;
	chapter: Chapter;
	story: StorySummaryResult;
	characters: Character[];
	settings: Setting[];
	language?: string;
}

export interface GenerateSceneContentResult {
	content: string;
	wordCount: number;
	metadata: GeneratorMetadata;
}

// ============================================================================
// Scene Evaluation Generator
// ============================================================================

export interface EvaluateSceneParams {
	sceneId: string;
	content: string;
	story: StorySummaryResult;
	maxIterations?: number;
}

export interface EvaluateSceneResult {
	finalContent: string;
	score: number;
	categories: {
		plot: number;
		character: number;
		pacing: number;
		prose: number;
		worldBuilding: number;
	};
	feedback: string;
	iterations: number;
	improved: boolean;
	metadata: GeneratorMetadata;
}

// ============================================================================
// Images Generator
// ============================================================================

export interface GenerateImagesParams {
	storyId: string;
	userId: string;
	story?: StorySummaryResult;
	characters?: Character[];
	settings?: Setting[];
	scenes?: Scene[];
	imageTypes: ("story" | "character" | "setting" | "scene")[];
	onProgress?: ProgressCallback;
}

export interface GenerateImagesResult {
	generatedImages: {
		type: "story" | "character" | "setting" | "scene";
		entityId: string;
		imageUrl: string;
		variants: any;
	}[];
	metadata: {
		totalGenerated: number;
		generationTime: number;
	};
}

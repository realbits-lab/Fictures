/**
 * Generator Types
 *
 * Contains all types for the story generation system:
 * - AI system infrastructure types
 * - Generator function parameter/result types
 * - Entity types are in zod-schemas.generated.ts
 */

import type { z } from "zod";
import type {
	Chapter,
	Character,
	Part,
	Scene,
	Setting,
	Story,
} from "./zod-schemas.generated";

// ============================================================================
// AI Provider Types
// ============================================================================

export type ModelProvider = "gemini" | "ai-server";

export type PromptType =
	| "story"
	| "character"
	| "setting"
	| "part"
	| "chapter"
	| "scene_summary"
	| "scene_content"
	| "character_dialogue"
	| "setting_description";

export interface PromptTemplate {
	system: string;
	userTemplate: string;
}

// ============================================================================
// Text Generation Request/Response Types
// ============================================================================

/**
 * Response format for text generation
 * - 'text': Plain text response (default)
 * - 'json': Structured JSON response with schema validation
 */
export type ResponseFormat = "text" | "json";

/**
 * Schema definition for structured JSON output
 * Can be a Zod schema, JSON Schema object, or TypeScript type
 */
export type ResponseSchema = z.ZodType<any> | Record<string, any>;

export interface TextGenerationRequest {
	prompt: string;
	systemPrompt?: string;
	model?: string;
	temperature?: number;
	maxTokens?: number;
	topP?: number;
	stopSequences?: string[];

	// Structured output options
	responseFormat?: ResponseFormat;
	responseSchema?: ResponseSchema;
}

export interface TextGenerationResponse {
	text: string;
	model: string;
	tokensUsed?: number;
	finishReason?: string;
}

export interface GenerationOptions {
	temperature?: number;
	maxTokens?: number;
	topP?: number;
	stopSequences?: string[];
	responseFormat?: ResponseFormat;
	responseSchema?: ResponseSchema;
}

// ============================================================================
// Story Cycle Types (used across generators)
// ============================================================================

/**
 * Virtue types used in the Adversity-Triumph Engine
 */
export type VirtueType =
	| "courage"
	| "compassion"
	| "integrity"
	| "loyalty"
	| "wisdom"
	| "sacrifice";

/**
 * Chapter arc position in story structure
 */
export type ArcPosition = "beginning" | "middle" | "climax" | "resolution";

/**
 * Adversity-Triumph cycle phases for scene structure
 */
export type CyclePhase =
	| "setup"
	| "confrontation"
	| "virtue"
	| "consequence"
	| "transition";

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
	story: Story;
	storyId: string;
	metadata: GeneratorMetadata;
}

// ============================================================================
// Characters Generator
// ============================================================================

export interface GenerateCharactersParams {
	storyId: string;
	story: Story;
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
	story: Story;
	settingCount: number;
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
	story: Story;
	characters: Character[];
	partsCount: number;
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
	story: Story;
	parts: Part[];
	characters: Character[];
	chaptersPerPart: number;
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
	chapters: Chapter[];
	settings: Setting[];
	scenesPerChapter: number;
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
	scene: Scene;
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
	content: string;
	story: Story;
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
	story?: Story;
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

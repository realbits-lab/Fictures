/**
 * Text Generation Types
 */

import type { z } from "zod";

export type ModelProvider = "gemini" | "ai-server";

export type PromptType =
	| "chapter_generation"
	| "scene_content"
	| "scene_summary"
	| "character_dialogue"
	| "setting_description"
	| "story";

export interface PromptTemplate {
	system: string;
	userTemplate: string;
}

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

/**
 * Story Generation Types
 */

export type VirtueType =
	| "courage"
	| "compassion"
	| "integrity"
	| "loyalty"
	| "wisdom"
	| "sacrifice";
export type ArcPosition = "beginning" | "middle" | "climax" | "resolution";
export type CyclePhase =
	| "setup"
	| "confrontation"
	| "virtue"
	| "consequence"
	| "transition";

export interface PartGenerationResult {
	id?: string;
	title: string;
	summary: string;
	orderIndex: number;
	characterArcs: any[];
}

export interface CharacterGenerationResult {
	id: string;
	name: string;
	coreTrait: string;
	internalFlaw: string;
	externalGoal: string;
	voiceStyle: {
		tone: string;
		vocabulary: string;
		quirks: string[];
		emotionalRange: string;
	};
	personality: {
		traits: string[];
		values: string[];
	};
	physicalDescription: {
		appearance: string;
	};
}

export interface SettingGenerationResult {
	id: string;
	name: string;
	mood: string;
	emotionalResonance: string;
	sensory: {
		sight: string[];
		sound: string[];
		smell: string[];
		touch: string[];
		taste?: string[];
	};
	cycleAmplification: {
		setup: string;
		confrontation: string;
		virtue: string;
		consequence: string;
		transition: string;
	};
}

export interface ChapterGenerationResult {
	title: string;
	summary: string;
	characterId: string;
	arcPosition: ArcPosition;
	contributesToMacroArc: string;
	focusCharacters: string[];
	adversityType: string;
	virtueType: VirtueType;
	seedsPlanted: any[];
	seedsResolved: any[];
	connectsToPreviousChapter: string;
	createsNextAdversity: string;
}

export interface SceneSummaryResult {
	title: string;
	summary: string;
	cyclePhase: CyclePhase;
	emotionalBeat: string;
	dialogueVsDescription: string;
	suggestedLength: "short" | "medium" | "long";
	characterFocus: string[];
	sensoryAnchors: string[];
}

export interface SceneContentResult {
	content: string;
	emotionalTone: string;
}

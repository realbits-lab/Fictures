/**
 * Studio API Request/Response Type Definitions
 *
 * Centralized type definitions for all Studio API generator endpoints.
 * Follows unified naming convention: Generate{Entity}{Suffix}
 *
 * Type Suffixes:
 * - Request: HTTP request body (API layer)
 * - Response: HTTP success response (API layer)
 * - ErrorResponse: HTTP error response (API layer)
 */

// ============================================================================
// Story Generation
// ============================================================================

export interface GenerateStoryRequest {
	userPrompt: string;
	language?: string;
	preferredGenre?: string;
	preferredTone?: "hopeful" | "dark" | "bittersweet" | "satirical";
}

export interface GenerateStoryResponse {
	success: true;
	story: {
		id: string;
		authorId: string;
		title: string;
		summary: string | null;
		genre: string | null;
		tone: string;
		moralFramework: string | null;
		status: string;
		createdAt: Date;
		updatedAt: Date;
	};
	metadata: {
		generationTime: number;
		model?: string;
	};
}

export interface GenerateStoryErrorResponse {
	error: string;
	details?: string;
}

// ============================================================================
// Character Generation
// ============================================================================

export interface GenerateCharactersRequest {
	storyId: string;
	characterCount?: number;
	language?: string;
}

export interface GenerateCharactersResponse {
	success: true;
	characters: Array<{
		id: string;
		storyId: string;
		name: string;
		isMain: boolean;
		summary: string | null;
		coreTrait: string | null;
		internalFlaw: string | null;
		externalGoal: string | null;
		personality: any | null;
		backstory: string | null;
		relationships: any | null;
		physicalDescription: any | null;
		voiceStyle: any | null;
		imageUrl: string | null;
		imageVariants: any | null;
		visualStyle: string | null;
		createdAt: Date;
		updatedAt: Date;
	}>;
	metadata: {
		totalGenerated: number;
		generationTime: number;
	};
}

export interface GenerateCharactersErrorResponse {
	error: string;
	details?: any;
}

// ============================================================================
// Setting Generation
// ============================================================================

export interface GenerateSettingsRequest {
	storyId: string;
	settingCount?: number;
}

export interface GenerateSettingsResponse {
	success: true;
	settings: Array<any>;
	metadata: {
		totalGenerated: number;
		generationTime: number;
	};
}

export interface GenerateSettingsErrorResponse {
	error: string;
	details?: any;
}

// ============================================================================
// Part Generation
// ============================================================================

export interface GeneratePartsRequest {
	storyId: string;
	partsCount?: number;
	language?: string;
}

export interface GeneratePartsResponse {
	success: true;
	parts: Array<any>;
	metadata: {
		totalGenerated: number;
		generationTime: number;
	};
}

export interface GeneratePartsErrorResponse {
	error: string;
	details?: any;
}

// ============================================================================
// Chapter Generation
// ============================================================================

export interface GenerateChaptersRequest {
	storyId: string;
	chaptersPerPart?: number;
	language?: string;
}

export interface GenerateChaptersResponse {
	success: true;
	chapters: Array<any>;
	metadata: {
		totalGenerated: number;
		generationTime: number;
	};
}

export interface GenerateChaptersErrorResponse {
	error: string;
	details?: any;
}

// ============================================================================
// Scene Summary Generation
// ============================================================================

export interface GenerateSceneSummariesRequest {
	storyId: string;
	scenesPerChapter?: number;
	language?: string;
}

export interface GenerateSceneSummariesResponse {
	success: true;
	scenes: Array<any>;
	metadata: {
		totalGenerated: number;
		generationTime: number;
	};
}

export interface GenerateSceneSummariesErrorResponse {
	error: string;
	details?: any;
}

// ============================================================================
// Scene Content Generation
// ============================================================================

export interface GenerateSceneContentRequest {
	sceneId: string;
	language?: string;
}

export interface GenerateSceneContentResponse {
	success: true;
	scene: any;
	metadata: {
		wordCount: number;
		generationTime: number;
	};
}

export interface GenerateSceneContentErrorResponse {
	error: string;
	details?: any;
}

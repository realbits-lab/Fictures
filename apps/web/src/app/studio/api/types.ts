/**
 * Studio API Request/Response Type Definitions
 *
 * Layer: API (HTTP Contracts)
 * Used by: src/app/studio/api/* routes
 * Related:
 * - Service types: src/lib/studio/generators/types.ts
 * - Domain types: src/lib/ai/types/image.ts
 * - Global types: src/types/index.ts
 *
 * ## Purpose
 * Defines the HTTP API contract for all Studio generator endpoints.
 * These types represent the data exchanged between client and server.
 *
 * ## Naming Convention
 * Follows unified naming pattern: Generate{Entity}{Suffix}
 *
 * Type Suffixes:
 * - Request: HTTP request body (what client sends)
 * - Response: HTTP success response (what server returns on success)
 * - ErrorResponse: HTTP error response (what server returns on error)
 *
 * ## Architecture
 * API Layer (this file) → Service Layer (generators/types.ts) → Domain Layer (ai/types)
 *
 * API types are mapped to service types in route handlers:
 * - GenerateStoryRequest → GenerateStoryParams (service input)
 * - GenerateStoryResult (service output) → GenerateStoryResponse
 *
 * ## Available Endpoints
 * - POST /studio/api/stories - Generate story summary
 * - POST /studio/api/characters - Generate characters
 * - POST /studio/api/settings - Generate story settings
 * - POST /studio/api/parts - Generate story parts
 * - POST /studio/api/chapters - Generate chapters
 * - POST /studio/api/scenes - Generate scene summaries
 * - POST /studio/api/scene-content - Generate scene content
 * - POST /studio/api/scene-evaluation - Evaluate and improve scene quality
 */

import type {
    Chapter,
    Character,
    Part,
    Scene,
    Setting,
    Story,
} from "@/lib/studio/generators/zod-schemas.generated";

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
    story: Story;
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
    characters: Character[];
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
    settings: Setting[];
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
    parts: Part[];
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
    chapters: Chapter[];
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
    scenes: Scene[];
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
    scene: Scene;
    metadata: {
        wordCount: number;
        generationTime: number;
    };
}

export interface GenerateSceneContentErrorResponse {
    error: string;
    details?: any;
}

// ============================================================================
// Scene Evaluation
// ============================================================================

export interface EvaluateSceneRequest {
    sceneId: string;
    maxIterations?: number;
}

export interface EvaluateSceneResponse {
    success: true;
    scene: Scene;
    evaluation: {
        score: number;
        categories: {
            plot: number;
            character: number;
            pacing: number;
            prose: number;
            worldBuilding: number;
        };
        feedback: {
            strengths: string[];
            improvements: string[];
        };
        iterations: number;
        improved: boolean;
    };
    metadata: {
        generationTime: number;
    };
}

export interface EvaluateSceneErrorResponse {
    error: string;
    details?: any;
}

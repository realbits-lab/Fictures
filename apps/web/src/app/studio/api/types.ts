/**
 * Studio API Request/Response Type Definitions
 *
 * Layer: API (HTTP Contracts)
 * Used by: src/app/studio/api/* routes
 * Related:
 * - AI types: src/lib/studio/generators/zod-schemas.generated.ts
 * - Service types: src/lib/studio/generators/types.ts (TBD)
 * - Domain types: src/lib/ai/types/image.ts
 * - Global types: src/types/index.ts
 *
 * ## Purpose
 * Defines the HTTP API contract for all Studio generator endpoints.
 * These types represent the data exchanged between client and server.
 *
 * ## Naming Convention
 * Follows layer-based naming pattern: Api{Entity}{Suffix}
 *
 * Type Suffixes:
 * - Request: HTTP request body (what client sends)
 * - Response: HTTP success response (what server returns on success)
 * - ErrorResponse: HTTP error response (what server returns on error)
 *
 * ## Architecture
 * API Layer (this file) → Service Layer (generators/types.ts - TBD) → Generator Layer → AI Layer (Zod schemas)
 *
 * API types are mapped to service types in route handlers:
 * - ApiStoryRequest → ServiceStoryParams (service input)
 * - ServiceStoryResult (service output) → ApiStoryResponse
 *
 * ## SSOT Flow
 * AiStoryZodSchema (Zod - SSOT) → AiStoryType (TypeScript) → ApiStoryResponse (API layer)
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

import type { StoryGenre } from "@/lib/constants/genres";
import type { StoryTone } from "@/lib/constants/tones";
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

export interface ApiStoryRequest {
    userPrompt: string;
    language?: string;
    preferredGenre?: StoryGenre;
    preferredTone?: StoryTone;
}

export interface ApiStoryResponse {
    success: true;
    story: Story;
    metadata: {
        generationTime: number;
        model?: string;
    };
}

export interface ApiStoryErrorResponse {
    error: string;
    details?: string;
}

// ============================================================================
// Character Generation
// ============================================================================

export interface ApiCharactersRequest {
    storyId: string;
    characterCount?: number;
    language?: string;
}

export interface ApiCharactersResponse {
    success: true;
    characters: Character[];
    metadata: {
        totalGenerated: number;
        generationTime: number;
    };
}

export interface ApiCharactersErrorResponse {
    error: string;
    details?: unknown;
}

// ============================================================================
// Setting Generation
// ============================================================================

export interface ApiSettingsRequest {
    storyId: string;
    settingCount?: number;
}

export interface ApiSettingsResponse {
    success: true;
    settings: Setting[];
    metadata: {
        totalGenerated: number;
        generationTime: number;
    };
}

export interface ApiSettingsErrorResponse {
    error: string;
    details?: unknown;
}

// ============================================================================
// Part Generation
// ============================================================================

export interface ApiPartsRequest {
    storyId: string;
    partsCount?: number;
    language?: string;
}

export interface ApiPartsResponse {
    success: true;
    parts: Part[];
    metadata: {
        totalGenerated: number;
        generationTime: number;
    };
}

export interface ApiPartsErrorResponse {
    error: string;
    details?: unknown;
}

// ============================================================================
// Part Generation (Singular - Extreme Incremental)
// ============================================================================

export interface ApiPartRequest {
    storyId: string;
}

export interface ApiPartResponse {
    success: true;
    part: Part;
    metadata: {
        generationTime: number;
        partIndex: number;
        totalParts: number;
    };
}

export interface ApiPartErrorResponse {
    error: string;
    details?: unknown;
}

// ============================================================================
// Chapter Generation
// ============================================================================

export interface ApiChaptersRequest {
    storyId: string;
    chaptersPerPart?: number;
    language?: string;
}

export interface ApiChaptersResponse {
    success: true;
    chapters: Chapter[];
    metadata: {
        totalGenerated: number;
        generationTime: number;
    };
}

export interface ApiChaptersErrorResponse {
    error: string;
    details?: unknown;
}

// ============================================================================
// Chapter Generation (Singular - Extreme Incremental)
// ============================================================================

export interface ApiChapterRequest {
    storyId: string;
    partId: string;
}

export interface ApiChapterResponse {
    success: true;
    chapter: Chapter;
    metadata: {
        generationTime: number;
        chapterIndex: number; // Global index (position in entire story)
        totalChapters: number; // Total chapters in story
    };
}

export interface ApiChapterErrorResponse {
    error: string;
    details?: unknown;
}

// ============================================================================
// Scene Summary Generation
// ============================================================================

export interface ApiSceneSummariesRequest {
    storyId: string;
    scenesPerChapter?: number;
    language?: string;
}

export interface ApiSceneSummariesResponse {
    success: true;
    scenes: Scene[];
    metadata: {
        totalGenerated: number;
        generationTime: number;
    };
}

export interface ApiSceneSummariesErrorResponse {
    error: string;
    details?: unknown;
}

// ============================================================================
// Scene Summary Generation (Singular - Extreme Incremental)
// ============================================================================

export interface ApiSceneSummaryRequest {
    storyId: string;
    chapterId: string;
}

export interface ApiSceneSummaryResponse {
    success: true;
    scene: Scene;
    metadata: {
        generationTime: number;
        sceneIndex: number; // Global index (position in entire story)
        totalScenes: number; // Total scenes in story
    };
}

export interface ApiSceneSummaryErrorResponse {
    error: string;
    details?: unknown;
}

// ============================================================================
// Scene Content Generation
// ============================================================================

export interface ApiSceneContentRequest {
    sceneId: string;
    language?: string;
}

export interface ApiSceneContentResponse {
    success: true;
    scene: Scene;
    metadata: {
        wordCount: number;
        generationTime: number;
    };
}

export interface ApiSceneContentErrorResponse {
    error: string;
    details?: unknown;
}

// ============================================================================
// Scene Evaluation
// ============================================================================

export interface ApiSceneEvaluationRequest {
    sceneId: string;
    maxIterations?: number;
}

export interface ApiSceneEvaluationResponse {
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

export interface ApiSceneEvaluationErrorResponse {
    error: string;
    details?: unknown;
}

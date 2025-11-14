/**
 * Studio API Types & Validation Schemas
 *
 * Layer: API (HTTP Contracts)
 * Used by: src/app/api/studio/* routes
 * Related:
 * - AI types: src/lib/schemas/ai
 * - Service types: src/lib/studio/generators/types.ts
 * - Domain types: src/lib/ai/types/image.ts
 * - Global types: src/types/index.ts
 *
 * ## Purpose
 * Defines the HTTP API contract for all Studio generator endpoints.
 * Includes both TypeScript types and Zod validation schemas.
 *
 * ## Naming Convention
 * - Types: Api{Entity}{Suffix} (ApiStoryRequest, ApiStoryResponse, ApiStoryErrorResponse)
 * - Schemas: generate{Entity}Schema (generateStorySchema, generateCharactersSchema)
 *
 * ## Architecture
 * API Layer (this file) → Service Layer (generators/types.ts) → Generator Layer → AI Layer (Zod schemas)
 *
 * API types are mapped to service types in route handlers:
 * - ApiStoryRequest → ServiceStoryParams (service input)
 * - ServiceStoryResult (service output) → ApiStoryResponse
 *
 * ## SSOT Flow
 * AiStoryZodSchema (Zod - SSOT) → AiStoryType (TypeScript) → ApiStoryResponse (API layer)
 *
 * ## Available Endpoints
 * - POST /api/studio/story - Generate story summary
 * - POST /api/studio/characters - Generate characters
 * - POST /api/studio/settings - Generate story settings
 * - POST /api/studio/parts - Generate story parts
 * - POST /api/studio/chapters - Generate chapters
 * - POST /api/studio/scenes - Generate scene summaries
 * - POST /api/studio/scene-content - Generate scene content
 * - POST /api/studio/scene-improvement - Improve scene quality
 */

import { z } from "zod";
import type { StoryGenre } from "@/lib/constants/genres";
import { STORY_GENRES } from "@/lib/constants/genres";
import type { StoryTone } from "@/lib/constants/tones";
import { STORY_TONES } from "@/lib/constants/tones";
import type {
    Chapter,
    Character,
    Part,
    Scene,
    Setting,
    Story,
} from "@/lib/schemas/generated-zod";

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
// Scene Improvement
// ============================================================================

export interface ApiSceneImprovementRequest {
    sceneId: string;
    maxIterations?: number;
}

export interface ApiSceneImprovementResponse {
    success: true;
    scene: Scene;
    improvement: {
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

export interface ApiSceneImprovementErrorResponse {
    error: string;
    details?: unknown;
}

// ============================================================================
// Validation Schemas (Zod)
// ============================================================================

/**
 * Validation schema for generating a story
 */
export const generateStorySchema = z.object({
    userPrompt: z.string().min(1),
    language: z.string().optional().default("English"),
    preferredGenre: z.enum(STORY_GENRES).optional(),
    preferredTone: z.enum(STORY_TONES).optional(),
});

/**
 * Validation schema for generating characters
 */
export const generateCharactersSchema = z.object({
    storyId: z.string(),
    characterCount: z.number().min(1).max(10).optional().default(3),
    language: z.string().optional().default("English"),
});

/**
 * Validation schema for generating settings
 */
export const generateSettingsSchema = z.object({
    storyId: z.string(),
    settingCount: z.number().min(1).max(10).optional().default(3),
});

/**
 * Validation schema for generating parts
 */
export const generatePartsSchema = z.object({
    storyId: z.string(),
    partsCount: z.number().min(1).max(10).optional().default(3),
    language: z.string().optional().default("English"),
});

/**
 * Validation schema for generating chapters
 */
export const generateChaptersSchema = z.object({
    storyId: z.string(),
    chaptersPerPart: z.number().min(1).max(10).optional().default(3),
    language: z.string().optional().default("English"),
});

/**
 * Validation schema for generating scene summaries
 */
export const generateSceneSummariesSchema = z.object({
    storyId: z.string(),
    scenesPerChapter: z.number().min(1).max(10).optional().default(3),
    language: z.string().optional().default("English"),
});

/**
 * Validation schema for generating scene content
 */
export const generateSceneContentSchema = z.object({
    sceneId: z.string(),
    language: z.string().optional().default("English"),
});

/**
 * Validation schema for improving scene quality
 */
export const improveSceneSchema = z.object({
    sceneId: z.string(),
    maxIterations: z.number().min(1).max(3).optional().default(2),
});

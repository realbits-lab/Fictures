/**
 * Generator Types
 *
 * Layer: Service (Business Logic)
 * Used by: src/lib/studio/generators/* services
 * Related:
 * - API types: src/app/studio/api/types.ts
 * - Domain types: src/lib/ai/types/image.ts
 * - Entity types: ./zod-schemas.generated.ts
 * - Global types: src/types/index.ts
 *
 * ## Purpose
 * Defines internal function parameters and results for story generation business logic.
 * These types represent the service layer contract between route handlers and generators.
 *
 * ## Naming Convention
 * Follows unified naming pattern: Generate{Entity}{Suffix}
 *
 * Type Suffixes:
 * - Params: Function input parameters (internal service input)
 * - Result: Function output results (internal service output)
 * - Metadata: Generation metadata and statistics
 *
 * ## Architecture
 * API Layer (api/types.ts) → Service Layer (this file) → Domain Layer (ai/types)
 *
 * Route handlers map between API and Service types:
 * - API Request → Service Params (route extracts and validates)
 * - Service Result → API Response (route formats for HTTP)
 *
 * ## Available Generators
 * - generateStory - Story summary generation
 * - generateCharacters - Character profiles generation
 * - generateSettings - Story settings generation
 * - generateParts - Story parts generation
 * - generateChapters - Chapter summaries generation
 * - generateSceneSummaries - Scene summaries generation
 * - generateSceneContent - Scene content generation
 * - evaluateScene - Scene quality evaluation
 * - generateImages - Image generation for all entity types
 *
 * ## Type Organization
 * - AI Provider Types - Model providers and prompt infrastructure
 * - Text Generation - Text generation request/response
 * - Story Cycle Types - Adversity-Triumph Engine concepts
 * - Base Generator Interfaces - Common generator patterns
 * - Entity-specific Generators - One section per entity type
 */

import type { z } from "zod";
import type {
    Chapter,
    Character,
    GeneratedStoryData,
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

export interface ArrayGeneratorMetadata {
    totalGenerated: number;
    generationTime: number;
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
    userPrompt: string;
    language?: string;
    preferredGenre?: string;
    preferredTone?: string;
}

export interface GenerateStoryResult {
    story: GeneratedStoryData;
    metadata: GeneratorMetadata;
}

// ============================================================================
// Characters Generator
// ============================================================================

export interface GenerateCharactersParams {
    story: Story;
    characterCount: number;
    language?: string;
    onProgress?: ProgressCallback;
}

export interface GenerateCharactersResult {
    characters: Character[];
    metadata: ArrayGeneratorMetadata;
}

// ============================================================================
// Settings Generator
// ============================================================================

export interface GenerateSettingsParams {
    story: Story;
    settingCount: number;
    onProgress?: ProgressCallback;
}

export interface GenerateSettingsResult {
    settings: Setting[];
    metadata: ArrayGeneratorMetadata;
}

// ============================================================================
// Parts Generator
// ============================================================================

export interface GeneratePartsParams {
    story: Story;
    characters: Character[];
    partsCount: number;
    onProgress?: ProgressCallback;
}

export interface GeneratePartsResult {
    parts: Part[];
    metadata: ArrayGeneratorMetadata;
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
    metadata: ArrayGeneratorMetadata;
}

// ============================================================================
// Scene Summaries Generator
// ============================================================================

export interface GenerateSceneSummariesParams {
    chapters: Chapter[];
    settings: Setting[];
    scenesPerChapter: number;
    onProgress?: ProgressCallback;
}

export interface GenerateSceneSummariesResult {
    scenes: Scene[];
    metadata: ArrayGeneratorMetadata;
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
    metadata: ArrayGeneratorMetadata;
}

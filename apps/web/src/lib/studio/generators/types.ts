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
import type { ChapterArcPosition } from "@/lib/constants/arc-positions";
import type {
    Chapter,
    Character,
    GeneratedChapterData,
    GeneratedCharacterData,
    GeneratedPartData,
    GeneratedSceneSummaryData,
    GeneratedSettingData,
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
    | "scene_content";

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
 * Re-exported from constants for backward compatibility
 */
export type ArcPosition = ChapterArcPosition;

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
    preferredGenre?: import("@/lib/constants/genres").StoryGenre;
    preferredTone?: import("@/lib/constants/tones").StoryTone;
}

export interface StoryPromptParams extends Record<string, string> {
    userPrompt: string;
    genre: string;
    tone: string;
    language: string;
}

export interface GenerateStoryResult {
    story: Story;
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

export interface CharacterPromptParams extends Record<string, string> {
    characterNumber: string;
    characterCount: string;
    storyTitle: string;
    storyGenre: string;
    storyTone: string;
    storySummary: string;
    moralFramework: string;
    characterType: string;
    language: string;
}

export interface GenerateCharactersResult {
    characters: GeneratedCharacterData[];
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

export interface SettingPromptParams extends Record<string, string> {
    settingNumber: string;
    settingCount: string;
    storyTitle: string;
    storyGenre: string;
    storySummary: string;
    moralFramework: string;
}

export interface GenerateSettingsResult {
    settings: GeneratedSettingData[];
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

export interface PartPromptParams extends Record<string, string> {
    partNumber: string;
    storyTitle: string;
    storyGenre: string;
    storySummary: string;
    moralFramework: string;
    characters: string;
}

export interface GeneratePartsResult {
    parts: GeneratedPartData[];
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

export interface ChapterPromptParams extends Record<string, string> {
    chapterNumber: string;
    totalChapters: string;
    partTitle: string;
    storyTitle: string;
    storyGenre: string;
    storySummary: string;
    partSummary: string;
    characterName: string;
    characterFlaw: string;
    characterArc: string;
    previousChapterContext: string;
}

export interface GenerateChaptersResult {
    chapters: GeneratedChapterData[];
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

export interface SceneSummaryPromptParams extends Record<string, string> {
    sceneNumber: string;
    sceneCount: string;
    chapterTitle: string;
    chapterSummary: string;
    cyclePhase: string;
    settings: string;
}

export interface GenerateSceneSummariesResult {
    scenes: GeneratedSceneSummaryData[];
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

export interface SceneContentPromptParams extends Record<string, string> {
    sceneSummary: string;
    cyclePhase: string;
    emotionalBeat: string;
    suggestedLength: string;
    settingDescription: string;
    sensoryAnchors: string;
    characterName: string;
    voiceStyle: string;
    language: string;
}

export interface GenerateSceneContentResult {
    content: string;
    wordCount: number;
    metadata: GeneratorMetadata;
}

// ============================================================================
// Scene Evaluation Generator
// ============================================================================

/**
 * Story context for scene evaluation
 * Only requires the fields actually used by the evaluation logic
 */
export interface SceneEvaluationStoryContext {
    id: string;
    title: string;
    genre: import("@/lib/constants/genres").StoryGenre;
    moralFramework: string;
    summary: string;
    tone: import("@/lib/constants/tones").StoryTone;
}

export interface EvaluateSceneParams {
    content: string;
    story: SceneEvaluationStoryContext;
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
    feedback: {
        strengths: string[];
        improvements: string[];
    };
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

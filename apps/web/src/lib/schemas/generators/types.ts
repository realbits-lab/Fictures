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
    AiChapterType,
    AiCharacterType,
    AiPartType,
    AiSceneSummaryType,
    AiSettingType,
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
    | "toonplay";

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
 * Uses CYCLE_PHASES constant from zod-schemas.generated.ts
 */
export type CyclePhase =
    typeof import("./zod-schemas.generated").CYCLE_PHASES[number];

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
    story: string;
    characterType: string;
    language: string;
}

export interface GenerateCharactersResult {
    characters: AiCharacterType[];
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
    story: string;
}

export interface GenerateSettingsResult {
    settings: AiSettingType[];
    metadata: ArrayGeneratorMetadata;
}

// ============================================================================
// Parts Generator
// ============================================================================

export interface GeneratePartsParams {
    story: Story;
    characters: Character[];
    settings: Setting[];
    partsCount: number;
    onProgress?: ProgressCallback;
}

export interface PartPromptParams extends Record<string, string> {
    partNumber: string;
    story: string;
    characters: string;
    settings: string;
    previousPartsContext: string;
}

export interface GeneratePartsResult {
    parts: AiPartType[];
    metadata: ArrayGeneratorMetadata;
}

// ============================================================================
// Part Generator (Singular - Extreme Incremental)
// ============================================================================

export interface GeneratePartParams {
    story: Story;
    characters: (AiCharacterType & { id: string })[];
    settings: (AiSettingType & { id: string })[];
    previousParts: (AiPartType & { id: string })[];
    partIndex: number;
}

export interface GeneratePartResult {
    part: AiPartType;
    metadata: GeneratorMetadata;
}

// ============================================================================
// Chapters Generator
// ============================================================================

export interface GenerateChaptersParams {
    storyId: string;
    story: Story;
    parts: Part[];
    characters: Character[];
    settings?: Setting[]; // Optional settings for atmospheric context
    chaptersPerPart: number;
    onProgress?: ProgressCallback;
}

export interface ChapterPromptParams extends Record<string, string> {
    chapterNumber: string;
    story: string; // Comprehensive story context (title, genre, summary, moral framework)
    parts: string; // All parts with summaries and character arcs
    characters: string; // All characters with full details
    settings: string; // All settings with atmosphere and sensory details
    previousChaptersContext: string; // All previous chapters context
}

export interface GenerateChaptersResult {
    chapters: AiChapterType[];
    metadata: ArrayGeneratorMetadata;
}

// ============================================================================
// Chapter Generator (Singular - Extreme Incremental)
// ============================================================================

export interface GenerateChapterParams {
    story: Story;
    part: AiPartType & { id: string };
    characters: (AiCharacterType & { id: string })[];
    settings?: (AiSettingType & { id: string })[]; // Optional settings for atmospheric context
    previousChapters: (AiChapterType & { id: string; partId: string })[];
    chapterIndex: number; // Global index (position in entire story)
}

export interface GenerateChapterResult {
    chapter: AiChapterType;
    metadata: GeneratorMetadata;
}

// ============================================================================
// Scene Summaries Generator
// ============================================================================

export interface GenerateSceneSummariesParams {
    story: Story;
    part: Part;
    chapters: Chapter[];
    characters: Character[];
    settings: Setting[];
    scenesPerChapter: number;
    onProgress?: ProgressCallback;
}

export interface SceneSummaryPromptParams extends Record<string, string> {
    sceneNumber: string;
    sceneCount: string;
    story: string;
    part: string;
    chapter: string;
    characters: string;
    settings: string;
    previousScenesContext: string;
}

export interface GenerateSceneSummariesResult {
    scenes: AiSceneSummaryType[];
    metadata: ArrayGeneratorMetadata;
}

// ============================================================================
// Scene Summary Generator (Singular - Extreme Incremental)
// ============================================================================

export interface GenerateSceneSummaryParams {
    story: Story;
    part: AiPartType & { id: string };
    chapter: AiChapterType & { id: string; partId: string };
    characters: (AiCharacterType & { id: string })[];
    settings: (AiSettingType & { id: string })[];
    previousScenes: (AiSceneSummaryType & {
        id: string;
        chapterId: string;
    })[];
    sceneIndex: number; // Global index (position in entire story)
}

export interface GenerateSceneSummaryResult {
    scene: AiSceneSummaryType;
    metadata: GeneratorMetadata;
}

// ============================================================================
// Scene Content Generator
// ============================================================================

export interface GeneratorSceneContentParams {
    // === Required Objects ===
    story: Story;
    part: Part;
    chapter: Chapter;
    scene: Scene;
    characters: Character[];
    settings: Setting[];

    // === Optional ===
    language?: string;
}

export interface SceneContentPromptParams extends Record<string, string> {
    story: string;
    part: string;
    chapter: string;
    scene: string;
    characters: string;
    setting: string;
    language: string;
}

export interface GeneratorSceneContentResult {
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

// ============================================================================
// Toonplay Converter Generator
// ============================================================================

export interface GeneratorToonplayParams {
    scene: Scene;
    story: Story;
    characters: Character[];
    settings: Setting[];
    language?: string;
}

export interface ToonplayPromptParams extends Record<string, string> {
    sceneContent: string;
    sceneTitle: string;
    sceneSummary: string;
    storyGenre: string;
    storyTone: string;
    characters: string;
    settings: string;
    language: string;
}

export interface GeneratorToonplayResult {
    toonplay: import("@/lib/schemas/ai/ai-toonplay").AiComicToonplayType;
    metadata: GeneratorMetadata;
}

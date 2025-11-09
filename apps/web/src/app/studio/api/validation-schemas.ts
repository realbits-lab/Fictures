/**
 * Studio API Validation Schemas
 *
 * Layer: API Validation
 * Used by: src/app/studio/api/* routes
 * Related: src/app/studio/api/types.ts (TypeScript interfaces)
 *
 * ## Purpose
 * Centralizes all Zod validation schemas for Studio API endpoints.
 * Each schema validates incoming request bodies before processing.
 *
 * ## Naming Convention
 * Follows pattern: generate{Entity}Schema
 * Example: generateStorySchema, generatePartsSchema
 *
 * ## Usage in Routes
 * ```typescript
 * import { generatePartsSchema } from '../validation-schemas';
 *
 * const validatedData = generatePartsSchema.parse(body);
 * ```
 */

import { z } from "zod";

// ============================================================================
// Story Generation
// ============================================================================

/**
 * Validation schema for generating a story
 */
export const generateStorySchema = z.object({
    userPrompt: z.string().min(1),
    language: z.string().optional().default("English"),
    preferredGenre: z.string().optional(),
    preferredTone: z
        .enum(["hopeful", "dark", "bittersweet", "satirical"])
        .optional(),
});

// ============================================================================
// Character Generation
// ============================================================================

/**
 * Validation schema for generating characters
 */
export const generateCharactersSchema = z.object({
    storyId: z.string(),
    characterCount: z.number().min(1).max(10).optional().default(3),
    language: z.string().optional().default("English"),
});

// ============================================================================
// Setting Generation
// ============================================================================

/**
 * Validation schema for generating settings
 */
export const generateSettingsSchema = z.object({
    storyId: z.string(),
    settingCount: z.number().min(1).max(10).optional().default(3),
});

// ============================================================================
// Part Generation
// ============================================================================

/**
 * Validation schema for generating parts
 */
export const generatePartsSchema = z.object({
    storyId: z.string(),
    partsCount: z.number().min(1).max(10).optional().default(3),
    language: z.string().optional().default("English"),
});

// ============================================================================
// Chapter Generation
// ============================================================================

/**
 * Validation schema for generating chapters
 */
export const generateChaptersSchema = z.object({
    storyId: z.string(),
    chaptersPerPart: z.number().min(1).max(10).optional().default(3),
    language: z.string().optional().default("English"),
});

// ============================================================================
// Scene Summary Generation
// ============================================================================

/**
 * Validation schema for generating scene summaries
 */
export const generateSceneSummariesSchema = z.object({
    storyId: z.string(),
    scenesPerChapter: z.number().min(1).max(10).optional().default(3),
    language: z.string().optional().default("English"),
});

// ============================================================================
// Scene Content Generation
// ============================================================================

/**
 * Validation schema for generating scene content
 */
export const generateSceneContentSchema = z.object({
    sceneId: z.string(),
    language: z.string().optional().default("English"),
});

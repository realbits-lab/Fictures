/**
 * Auto-generated JSON Schemas from Zod schemas
 * DO NOT EDIT MANUALLY
 *
 * Type Naming Convention:
 * - AI Layer (SSOT): Ai{Entity}ZodSchema → z.toJSONSchema → Ai{Entity}JsonSchema
 *
 * SSOT Flow: AiStoryZodSchema (Zod) → z.toJSONSchema → AiStoryJsonSchema (JSON Schema)
 *
 * These JSON schemas are used for Gemini's structured output API.
 */

import { z } from "zod";
import {
    AiChapterZodSchema,
    AiCharacterZodSchema,
    AiPartZodSchema,
    AiSceneSummaryZodSchema,
    AiSettingZodSchema,
    AiStoryZodSchema,
} from "./zod-schemas.generated";

/**
 * Remove fields that Gemini doesn't accept and recursively clean the schema
 */
const cleanGeminiSchema = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => cleanGeminiSchema(item));
    }

    if (typeof obj === "object") {
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(
            obj as Record<string, unknown>,
        )) {
            // Skip fields that Gemini doesn't support
            if (key === "$schema" || key === "additionalProperties") {
                continue;
            }
            cleaned[key] = cleanGeminiSchema(value);
        }
        return cleaned;
    }

    return obj;
};

/**
 * Convert Zod schema to JSON Schema for Gemini API using Zod's built-in method
 */
const toGeminiJsonSchema = (zodSchema: z.ZodType) => {
    const jsonSchema = z.toJSONSchema(zodSchema, {
        target: "openapi-3.0",
        $refStrategy: "none",
    });
    return cleanGeminiSchema(jsonSchema) as Record<string, unknown>;
};

// ============================================================================
// Story JSON Schema
// ============================================================================

/**
 * JSON Schema for Story generation (Gemini structured output)
 * Uses minimal schema to avoid Gemini validation issues with complex fields
 */
export const AiStoryJsonSchema = toGeminiJsonSchema(AiStoryZodSchema);

// ============================================================================
// Character JSON Schema
// ============================================================================

/**
 * JSON Schema for Character generation (Gemini structured output)
 * Uses GeneratedCharacterSchema to avoid Gemini validation issues with DB-specific fields
 */
export const AiCharacterJsonSchema = toGeminiJsonSchema(AiCharacterZodSchema);

// ============================================================================
// Setting JSON Schema
// ============================================================================

/**
 * JSON Schema for Setting generation (Gemini structured output)
 * Uses GeneratedSettingSchema to avoid Gemini validation issues with DB-specific fields
 */
export const AiSettingJsonSchema = toGeminiJsonSchema(AiSettingZodSchema);

// ============================================================================
// Part JSON Schema
// ============================================================================

/**
 * JSON Schema for Part generation (Gemini structured output)
 * Uses GeneratedPartSchema to avoid Gemini validation issues with DB-specific fields
 */
export const AiPartJsonSchema = toGeminiJsonSchema(AiPartZodSchema);

// ============================================================================
// Chapter JSON Schema
// ============================================================================

/**
 * JSON Schema for Chapter generation (Gemini structured output)
 * Uses GeneratedChapterSchema to avoid Gemini validation issues with DB-specific fields
 */
export const AiChapterJsonSchema = toGeminiJsonSchema(AiChapterZodSchema);

// ============================================================================
// Scene JSON Schema
// ============================================================================

/**
 * JSON Schema for Scene Summary generation (Gemini structured output)
 * Uses AiSceneSummaryZodSchema to avoid Gemini validation issues with DB-specific fields
 */
export const AiSceneSummaryJsonSchema = toGeminiJsonSchema(
    AiSceneSummaryZodSchema,
);

// ============================================================================
// Re-export for convenience
// ============================================================================

export const jsonSchemas = {
    story: AiStoryJsonSchema,
    character: AiCharacterJsonSchema,
    setting: AiSettingJsonSchema,
    part: AiPartJsonSchema,
    chapter: AiChapterJsonSchema,
    scene: AiSceneSummaryJsonSchema,
} as const;

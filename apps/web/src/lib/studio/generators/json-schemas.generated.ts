/**
 * Auto-generated JSON Schemas from Zod schemas
 * DO NOT EDIT MANUALLY
 *
 * Flow: Drizzle schema.ts → drizzle-zod → Zod schemas → z.toJSONSchema() → JSON schemas
 *
 * These JSON schemas are used for Gemini's structured output API.
 */

import { z } from "zod";
import {
	insertChapterSchema,
	insertCharacterSchema,
	insertPartSchema,
	insertSceneSchema,
	insertSettingSchema,
	insertStorySchema,
} from "./zod-schemas.generated";

/**
 * Remove $schema field that Gemini doesn't accept
 */
const removeSchemaField = (schema: Record<string, unknown>) => {
	// biome-ignore lint/correctness/noUnusedVariables: $schema is intentionally removed
	const { $schema, ...rest } = schema;
	return rest;
};

/**
 * Convert Zod schema to JSON Schema for Gemini API using Zod's built-in method
 */
const toGeminiJsonSchema = (zodSchema: z.ZodType) => {
	return removeSchemaField(
		z.toJSONSchema(zodSchema, {
			target: "openapi-3.0",
			$refStrategy: "none",
		}),
	);
};

// ============================================================================
// Story JSON Schema
// ============================================================================

/**
 * JSON Schema for Story generation (Gemini structured output)
 */
export const StorySummaryJsonSchema = toGeminiJsonSchema(insertStorySchema);

// ============================================================================
// Character JSON Schema
// ============================================================================

/**
 * JSON Schema for Character generation (Gemini structured output)
 */
export const CharacterJsonSchema = toGeminiJsonSchema(insertCharacterSchema);

// ============================================================================
// Setting JSON Schema
// ============================================================================

/**
 * JSON Schema for Setting generation (Gemini structured output)
 */
export const SettingJsonSchema = toGeminiJsonSchema(insertSettingSchema);

// ============================================================================
// Part JSON Schema
// ============================================================================

/**
 * JSON Schema for Part generation (Gemini structured output)
 */
export const PartJsonSchema = toGeminiJsonSchema(insertPartSchema);

// ============================================================================
// Chapter JSON Schema
// ============================================================================

/**
 * JSON Schema for Chapter generation (Gemini structured output)
 */
export const ChapterJsonSchema = toGeminiJsonSchema(insertChapterSchema);

// ============================================================================
// Scene JSON Schema
// ============================================================================

/**
 * JSON Schema for Scene Summary generation (Gemini structured output)
 */
export const SceneSummaryJsonSchema = toGeminiJsonSchema(insertSceneSchema);

// ============================================================================
// Re-export for convenience
// ============================================================================

export const jsonSchemas = {
	story: StorySummaryJsonSchema,
	character: CharacterJsonSchema,
	setting: SettingJsonSchema,
	part: PartJsonSchema,
	chapter: ChapterJsonSchema,
	scene: SceneSummaryJsonSchema,
} as const;

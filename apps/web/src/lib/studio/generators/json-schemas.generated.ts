/**
 * Auto-generated JSON Schemas from Zod schemas
 * DO NOT EDIT MANUALLY
 *
 * Flow: Drizzle schema.ts → drizzle-zod → Zod schemas → zod-to-json-schema → JSON schemas
 *
 * These JSON schemas are used for Gemini's structured output API.
 */

import { zodToJsonSchema } from "zod-to-json-schema";
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
const removeSchemaField = (schema: any) => {
	const { $schema, ...rest } = schema;
	return rest;
};

/**
 * Convert Zod schema to JSON Schema for Gemini API
 */
const toGeminiJsonSchema = (zodSchema: any) => {
	return removeSchemaField(
		zodToJsonSchema(zodSchema, {
			target: "openApi3",
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

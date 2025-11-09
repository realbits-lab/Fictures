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
	generatedCharacterSchema,
	generatedSettingSchema,
	generatedStorySchema,
	insertChapterSchema,
	insertPartSchema,
	insertSceneSchema,
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
		for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
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
export const StoryJsonSchema = toGeminiJsonSchema(generatedStorySchema);

// ============================================================================
// Character JSON Schema
// ============================================================================

/**
 * JSON Schema for Character generation (Gemini structured output)
 * Uses generatedCharacterSchema to avoid Gemini validation issues with DB-specific fields
 */
export const CharacterJsonSchema = toGeminiJsonSchema(generatedCharacterSchema);

// ============================================================================
// Setting JSON Schema
// ============================================================================

/**
 * JSON Schema for Setting generation (Gemini structured output)
 * Uses generatedSettingSchema to avoid Gemini validation issues with DB-specific fields
 */
export const SettingJsonSchema = toGeminiJsonSchema(generatedSettingSchema);

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
	story: StoryJsonSchema,
	character: CharacterJsonSchema,
	setting: SettingJsonSchema,
	part: PartJsonSchema,
	chapter: ChapterJsonSchema,
	scene: SceneSummaryJsonSchema,
} as const;

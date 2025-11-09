/**
 * Auto-generated Zod schemas from Drizzle ORM
 * DO NOT EDIT MANUALLY - Source of truth: src/lib/db/schema.ts
 *
 * Flow: Drizzle schema.ts → drizzle-zod → Zod schemas → TypeScript types
 */

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
	chapters,
	characters,
	parts,
	scenes,
	settings,
	stories,
} from "@/lib/db/schema";

// ============================================================================
// Story Schemas
// ============================================================================

/**
 * Zod schema for inserting a new story
 */
export const insertStorySchema = createInsertSchema(stories, {
	tone: z.enum(["hopeful", "dark", "bittersweet", "satirical"]),
});

/**
 * Zod schema for selecting a story from database
 */
export const selectStorySchema = createSelectSchema(stories);

/**
 * TypeScript type for Story (inferred from Zod)
 */
export type Story = z.infer<typeof selectStorySchema>;

/**
 * TypeScript type for inserting a Story
 */
export type InsertStory = z.infer<typeof insertStorySchema>;

/**
 * Minimal schema for AI story generation (only fields AI generates)
 * Manually defined to avoid Gemini JSON schema validation issues with complex fields
 * Fields must match insertStorySchema but without database-specific fields
 */
export const aiStoryGenerationSchema = z.object({
	title: z.string().max(255),
	summary: z.string().nullable(),
	genre: z.string().max(100).nullable(),
	tone: z.enum(["hopeful", "dark", "bittersweet", "satirical"]),
	moralFramework: z.string().nullable(),
});

/**
 * TypeScript type for AI-generated story data
 */
export type AIStoryGenerationData = z.infer<typeof aiStoryGenerationSchema>;

// ============================================================================
// Character Schemas
// ============================================================================

/**
 * Nested schema for character personality
 */
const personalitySchema = z.object({
	traits: z.array(z.string()),
	values: z.array(z.string()),
});

/**
 * Nested schema for character physical description
 */
const physicalDescriptionSchema = z.object({
	age: z.string(),
	appearance: z.string(),
	distinctiveFeatures: z.string(),
	style: z.string(),
});

/**
 * Nested schema for character voice style
 */
const voiceStyleSchema = z.object({
	tone: z.string(),
	vocabulary: z.string(),
	quirks: z.array(z.string()),
	emotionalRange: z.string(),
});

/**
 * Zod schema for inserting a new character
 */
export const insertCharacterSchema = createInsertSchema(characters, {
	coreTrait: z.enum([
		"courage",
		"compassion",
		"integrity",
		"loyalty",
		"wisdom",
		"sacrifice",
	]),
	personality: personalitySchema,
	physicalDescription: physicalDescriptionSchema,
	voiceStyle: voiceStyleSchema,
});

/**
 * Zod schema for selecting a character from database
 */
export const selectCharacterSchema = createSelectSchema(characters);

/**
 * TypeScript type for Character (inferred from Zod)
 */
export type Character = z.infer<typeof selectCharacterSchema>;

/**
 * TypeScript type for inserting a Character
 */
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;

// ============================================================================
// Setting Schemas
// ============================================================================

/**
 * Nested schema for setting adversity elements
 */
const adversityElementsSchema = z.object({
	physicalObstacles: z.array(z.string()),
	scarcityFactors: z.array(z.string()),
	dangerSources: z.array(z.string()),
	socialDynamics: z.array(z.string()),
});

/**
 * Nested schema for setting cycle amplification
 */
const cycleAmplificationSchema = z.object({
	setup: z.string(),
	confrontation: z.string(),
	virtue: z.string(),
	consequence: z.string(),
	transition: z.string(),
});

/**
 * Nested schema for setting sensory details
 */
const sensorySchema = z.object({
	sight: z.array(z.string()),
	sound: z.array(z.string()),
	smell: z.array(z.string()),
	touch: z.array(z.string()),
	taste: z.array(z.string()).optional(),
});

/**
 * Zod schema for inserting a new setting
 */
export const insertSettingSchema = createInsertSchema(settings, {
	adversityElements: adversityElementsSchema,
	cycleAmplification: cycleAmplificationSchema,
	sensory: sensorySchema,
});

/**
 * Zod schema for selecting a setting from database
 */
export const selectSettingSchema = createSelectSchema(settings);

/**
 * TypeScript type for Setting (inferred from Zod)
 */
export type Setting = z.infer<typeof selectSettingSchema>;

/**
 * TypeScript type for inserting a Setting
 */
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// ============================================================================
// Part Schemas
// ============================================================================

/**
 * Nested schema for character arcs within a part
 */
const characterArcSchema = z.object({
	characterId: z.string(),
	macroAdversity: z.object({
		internal: z.string(),
		external: z.string(),
	}),
	macroVirtue: z.string(),
	macroConsequence: z.string(),
	macroNewAdversity: z.string(),
	estimatedChapters: z.number(),
	arcPosition: z.enum(["primary", "secondary"]),
	progressionStrategy: z.string(),
});

/**
 * Zod schema for inserting a new part
 */
export const insertPartSchema = createInsertSchema(parts, {
	characterArcs: z.array(characterArcSchema),
});

/**
 * Zod schema for selecting a part from database
 */
export const selectPartSchema = createSelectSchema(parts);

/**
 * TypeScript type for Part (inferred from Zod)
 */
export type Part = z.infer<typeof selectPartSchema>;

/**
 * TypeScript type for inserting a Part
 */
export type InsertPart = z.infer<typeof insertPartSchema>;

// ============================================================================
// Chapter Schemas
// ============================================================================

/**
 * Nested schema for seeds planted in a chapter
 */
const seedPlantedSchema = z.object({
	id: z.string(),
	description: z.string(),
	expectedPayoff: z.string(),
});

/**
 * Nested schema for seeds resolved in a chapter
 */
const seedResolvedSchema = z.object({
	sourceChapterId: z.string(),
	sourceSceneId: z.string(),
	seedId: z.string(),
	payoffDescription: z.string(),
});

/**
 * Zod schema for inserting a new chapter
 */
export const insertChapterSchema = createInsertSchema(chapters, {
	arcPosition: z.enum(["beginning", "middle", "climax", "resolution"]),
	focusCharacters: z.array(z.string()),
	adversityType: z.enum(["internal", "external", "both"]),
	virtueType: z.enum([
		"courage",
		"compassion",
		"integrity",
		"sacrifice",
		"loyalty",
		"wisdom",
	]),
	seedsPlanted: z.array(seedPlantedSchema),
	seedsResolved: z.array(seedResolvedSchema),
});

/**
 * Zod schema for selecting a chapter from database
 */
export const selectChapterSchema = createSelectSchema(chapters);

/**
 * TypeScript type for Chapter (inferred from Zod)
 */
export type Chapter = z.infer<typeof selectChapterSchema>;

/**
 * TypeScript type for inserting a Chapter
 */
export type InsertChapter = z.infer<typeof insertChapterSchema>;

// ============================================================================
// Scene Schemas
// ============================================================================

/**
 * Zod schema for inserting a new scene
 */
export const insertSceneSchema = createInsertSchema(scenes, {
	cyclePhase: z.enum([
		"setup",
		"confrontation",
		"virtue",
		"consequence",
		"transition",
	]),
	emotionalBeat: z.enum([
		"fear",
		"hope",
		"tension",
		"relief",
		"elevation",
		"catharsis",
		"despair",
		"joy",
	]),
	characterFocus: z.array(z.string()),
	sensoryAnchors: z.array(z.string()),
	suggestedLength: z.enum(["short", "medium", "long"]).optional(),
	dialogueVsDescription: z.string().optional(),
});

/**
 * Zod schema for selecting a scene from database
 */
export const selectSceneSchema = createSelectSchema(scenes);

/**
 * TypeScript type for Scene (inferred from Zod)
 */
export type Scene = z.infer<typeof selectSceneSchema>;

/**
 * TypeScript type for inserting a Scene
 */
export type InsertScene = z.infer<typeof insertSceneSchema>;

// ============================================================================
// Re-export for convenience
// ============================================================================

export const schemas = {
	story: { insert: insertStorySchema, select: selectStorySchema },
	character: { insert: insertCharacterSchema, select: selectCharacterSchema },
	setting: { insert: insertSettingSchema, select: selectSettingSchema },
	part: { insert: insertPartSchema, select: selectPartSchema },
	chapter: { insert: insertChapterSchema, select: selectChapterSchema },
	scene: { insert: insertSceneSchema, select: selectSceneSchema },
} as const;

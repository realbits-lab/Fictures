/**
 * Generated Zod Validators - Auto-generated from Drizzle schemas
 *
 * These schemas are automatically generated from Drizzle table definitions
 * using drizzle-zod's createInsertSchema() and createSelectSchema().
 *
 * DO NOT manually edit table-level schemas here.
 * Update src/lib/schemas/drizzle/ instead and regenerate.
 */

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
    ADVERSITY_TYPES,
    CHAPTER_ARC_POSITIONS,
    CHARACTER_ARC_POSITIONS,
} from "@/lib/constants/arc-positions";
import { CHARACTER_ROLES } from "@/lib/constants/character-roles";
import { CORE_TRAITS } from "@/lib/constants/core-traits";
import { CYCLE_PHASES } from "@/lib/constants/cycle-phases";
import { EMOTIONAL_BEATS } from "@/lib/constants/emotional-beats";
import { STORY_TONES } from "@/lib/constants/tones";
import {
    chapters,
    characters,
    parts,
    scenes,
    settings,
    stories,
} from "@/lib/schemas/database";
import {
    adversityElementsSchema,
    consequenceElementsSchema,
    personalitySchema,
    physicalDescriptionSchema,
    sensorySchema,
    virtueElementsSchema,
    voiceStyleSchema,
} from "@/lib/schemas/zod/nested";

// ============================================================================
// Story Schemas
// ============================================================================

/**
 * Zod schema for inserting a new story
 */
export const insertStorySchema = createInsertSchema(stories, {
    tone: z.enum(STORY_TONES),
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

// ============================================================================
// Character Schemas
// ============================================================================

/**
 * Zod schema for inserting a new character
 */
export const insertCharacterSchema = createInsertSchema(characters, {
    role: z.enum(CHARACTER_ROLES as [string, ...string[]]),
    coreTrait: z.enum(CORE_TRAITS),
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
 * Zod schema for inserting a new setting
 */
export const insertSettingSchema = createInsertSchema(settings, {
    adversityElements: adversityElementsSchema,
    virtueElements: virtueElementsSchema,
    consequenceElements: consequenceElementsSchema,
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
    characterId: z
        .string()
        .describe("Unique identifier for the character in this arc"),
    macroAdversity: z
        .object({
            internal: z
                .string()
                .describe(
                    "Internal conflict or psychological challenge the character faces",
                ),
            external: z
                .string()
                .describe(
                    "External obstacles or adversity the character must overcome",
                ),
        })
        .describe(
            "Dual adversity structure combining internal and external challenges",
        ),
    macroVirtue: z
        .string()
        .describe(
            "The core virtue or moral strength displayed to overcome adversity",
        ),
    macroConsequence: z
        .string()
        .describe(
            "The outcome or impact of demonstrating virtue in facing adversity",
        ),
    macroNewAdversity: z
        .string()
        .describe(
            "New challenges or complications that arise from the consequences",
        ),
    // Optional planning fields (not used in incremental generation)
    estimatedChapters: z
        .number()
        .optional()
        .describe("Expected number of chapters to develop this character arc"),
    arcPosition: z
        .enum(CHARACTER_ARC_POSITIONS)
        .optional()
        .describe(
            "Priority level of this character arc - primary (main focus) or secondary (supporting)",
        ),
    progressionStrategy: z
        .string()
        .optional()
        .describe(
            "Plan for how the character's development will unfold across chapters",
        ),
});

/**
 * Zod schema for inserting a new part
 */
export const insertPartSchema = createInsertSchema(parts, {
    characterArcs: z.array(characterArcSchema),
    settingIds: z.array(z.string()),
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
 * Seeds are narrative elements (questions, mysteries, promises, setups) introduced for future payoff
 */
const seedPlantedSchema = z.object({
    id: z
        .string()
        .describe(
            "Unique identifier for this seed - used to track its resolution in later chapters",
        ),
    description: z
        .string()
        .describe(
            "What narrative element is being planted - a question raised, mystery introduced, promise made, or setup established",
        ),
    expectedPayoff: z
        .string()
        .describe(
            "How this seed is expected to pay off - what answer, revelation, fulfillment, or payoff the reader should anticipate",
        ),
});

/**
 * Nested schema for seeds resolved in a chapter
 * Tracks the resolution of previously planted narrative elements
 */
const seedResolvedSchema = z.object({
    sourceChapterId: z
        .string()
        .describe("ID of the chapter where the seed was originally planted"),
    sourceSceneId: z
        .string()
        .describe("ID of the scene where the seed was originally planted"),
    seedId: z
        .string()
        .describe(
            "ID of the seed being resolved - must match the id from seedPlantedSchema",
        ),
    payoffDescription: z
        .string()
        .describe(
            "How the seed is resolved - the answer revealed, mystery solved, promise fulfilled, or setup paid off",
        ),
});

/**
 * Nested schema for chapter character arc (micro-cycle)
 * Tracks the detailed narrative progression within a chapter
 */
const chapterCharacterArcSchema = z.object({
    characterId: z
        .string()
        .describe("ID of the character whose arc advances in this chapter"),
    microAdversity: z
        .object({
            internal: z
                .string()
                .describe("Specific fear/flaw confronted in this chapter"),
            external: z
                .string()
                .describe("Specific obstacle faced in this chapter"),
        })
        .describe(
            "The adversity faced in this chapter - both internal and external challenges",
        ),
    microVirtue: z
        .string()
        .describe(
            "The moral choice made in this chapter (building toward MACRO virtue)",
        ),
    microConsequence: z
        .string()
        .describe("The earned result of the virtue demonstrated"),
    microNewAdversity: z
        .string()
        .describe("The new problem created by this chapter's resolution"),
});

/**
 * Zod schema for inserting a new chapter
 */
export const insertChapterSchema = createInsertSchema(chapters, {
    arcPosition: z.enum(
        CHAPTER_ARC_POSITIONS as unknown as [string, ...string[]],
    ),
    characterArc: chapterCharacterArcSchema,
    focusCharacters: z.array(z.string()),
    adversityType: z.enum(ADVERSITY_TYPES as unknown as [string, ...string[]]),
    virtueType: z.enum(CORE_TRAITS),
    settingIds: z.array(z.string()),
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
 * Re-export cycle phase and emotional beat constants for convenience
 */
export { CYCLE_PHASES } from "@/lib/constants/cycle-phases";
export { EMOTIONAL_BEATS } from "@/lib/constants/emotional-beats";

/**
 * Suggested scene length enum
 */
export const SUGGESTED_LENGTHS = ["short", "medium", "long"] as const;

/**
 * Zod schema for inserting a new scene
 */
export const insertSceneSchema = createInsertSchema(scenes, {
    cyclePhase: z.enum(CYCLE_PHASES),
    emotionalBeat: z.enum(EMOTIONAL_BEATS),
    characterFocus: z.array(z.string()),
    sensoryAnchors: z.array(z.string()),
    suggestedLength: z.enum(SUGGESTED_LENGTHS).optional(),
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

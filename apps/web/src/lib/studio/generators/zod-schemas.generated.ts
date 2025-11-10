/**
 * Auto-generated Zod schemas from Drizzle ORM
 * DO NOT EDIT MANUALLY - Source of truth: src/lib/db/schema.ts
 *
 * Flow: Drizzle schema.ts → drizzle-zod → Zod schemas → TypeScript types
 */

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { CORE_TRAITS } from "@/lib/constants/core-traits";
import { STORY_GENRES } from "@/lib/constants/genres";
import { STORY_TONES } from "@/lib/constants/tones";
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

/**
 * Minimal schema for story generation (only fields AI generates)
 * Manually defined to avoid Gemini JSON schema validation issues with complex fields
 * Fields must match insertStorySchema but without database-specific fields
 */
export const GeneratedStorySchema = z.object({
    title: z
        .string()
        .max(255)
        .describe("The story title - engaging and memorable"),
    summary: z
        .string()
        .describe(
            "2-3 sentences describing the thematic premise and moral framework",
        ),
    genre: z
        .enum(STORY_GENRES as [string, ...string[]])
        .describe(
            "Story genre - must be one of: Fantasy, Romance, SciFi, Mystery, Horror, Action, Isekai, LitRPG, Cultivation, Slice, Paranormal, Dystopian, Historical, LGBTQ",
        ),
    tone: z
        .enum(STORY_TONES)
        .describe(
            "Story tone - must be one of: hopeful, dark, bittersweet, satirical",
        ),
    moralFramework: z
        .string()
        .describe(
            "The virtues valued in this story and moral questions explored",
        ),
});

/**
 * TypeScript type for generated story data (AI output)
 */
export type GeneratedStoryData = z.infer<typeof GeneratedStorySchema>;

// ============================================================================
// Character Schemas
// ============================================================================

/**
 * Nested schema for character personality
 */
const personalitySchema = z.object({
    traits: z
        .array(z.string())
        .describe(
            "Behavioral characteristics that shape how the character acts - examples: impulsive, optimistic, stubborn, cautious, charismatic",
        ),
    values: z
        .array(z.string())
        .describe(
            "Core beliefs and principles the character cares about - examples: family, honor, freedom, justice, loyalty",
        ),
});

/**
 * Nested schema for character physical description
 */
const physicalDescriptionSchema = z.object({
    age: z
        .string()
        .describe(
            "Character's age description - examples: early 20s, mid-30s, elderly, young adult, teenage",
        ),
    appearance: z
        .string()
        .describe(
            "Overall physical appearance and first impression - includes build, height, general look",
        ),
    distinctiveFeatures: z
        .string()
        .describe(
            "Memorable physical traits that make the character recognizable - examples: scar on left cheek, piercing green eyes, silver streak in hair",
        ),
    style: z
        .string()
        .describe(
            "How the character dresses and presents themselves - clothing choices, grooming, accessories",
        ),
});

/**
 * Nested schema for character voice style
 */
const voiceStyleSchema = z.object({
    tone: z
        .string()
        .describe(
            "Overall vocal quality and emotional coloring - examples: warm, sarcastic, formal, gentle, harsh, cheerful",
        ),
    vocabulary: z
        .string()
        .describe(
            "Language complexity and word choice - examples: simple, educated, technical, poetic, street slang, archaic",
        ),
    quirks: z
        .array(z.string())
        .describe(
            "Verbal tics, repeated phrases, or unique speech patterns - examples: 'you know', clears throat often, speaks in questions",
        ),
    emotionalRange: z
        .string()
        .describe(
            "How expressively the character shows emotions through speech - examples: reserved, expressive, volatile, stoic, animated",
        ),
});

/**
 * Zod schema for inserting a new character
 */
export const insertCharacterSchema = createInsertSchema(characters, {
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

/**
 * Minimal schema for character generation (only fields AI generates)
 * Manually defined to avoid Gemini JSON schema validation issues with complex fields
 * Fields must match insertCharacterSchema but without database-specific fields
 */
export const GeneratedCharacterSchema = z.object({
    name: z
        .string()
        .max(255)
        .describe(
            "Character's full name - should be memorable and fit the genre",
        ),
    isMain: z
        .boolean()
        .describe(
            "Whether this is a main character (true) or supporting character (false)",
        ),
    summary: z
        .string()
        .describe(
            "2-3 sentence overview of the character's role and significance in the story",
        ),
    coreTrait: z
        .enum(CORE_TRAITS)
        .describe(
            "The primary virtue this character embodies - must be one of: courage, compassion, integrity, loyalty, wisdom, sacrifice",
        ),
    internalFlaw: z
        .string()
        .describe(
            "The character's internal weakness or psychological challenge that creates internal adversity",
        ),
    externalGoal: z
        .string()
        .describe(
            "The character's external objective or desire that drives their actions and creates external adversity",
        ),
    personality: personalitySchema.describe(
        "Character's personality traits and values that shape their behavior and decisions",
    ),
    backstory: z
        .string()
        .describe(
            "Character's history and formative experiences that explain their current state and motivations",
        ),
    physicalDescription: physicalDescriptionSchema.describe(
        "Detailed physical appearance including age, looks, distinctive features, and style",
    ),
    voiceStyle: voiceStyleSchema.describe(
        "How the character speaks and expresses themselves - tone, vocabulary, quirks, and emotional range",
    ),
});

/**
 * TypeScript type for generated character data (AI output)
 */
export type GeneratedCharacterData = z.infer<typeof GeneratedCharacterSchema>;

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

/**
 * Minimal schema for setting generation (only fields AI generates)
 * Manually defined to avoid Gemini JSON schema validation issues with complex fields
 * Fields must match insertSettingSchema but without database-specific fields
 */
export const GeneratedSettingSchema = z.object({
    name: z.string().max(255),
    summary: z.string().nullable(),
    adversityElements: adversityElementsSchema.nullable(),
    symbolicMeaning: z.string().nullable(),
    cycleAmplification: cycleAmplificationSchema.nullable(),
    mood: z.string().nullable(),
    sensory: sensorySchema.nullable(),
    emotionalResonance: z.string().nullable(),
    architecturalStyle: z.string().nullable(),
    visualReferences: z
        .array(
            z.object({ category: z.string(), examples: z.array(z.string()) }),
        )
        .nullable(),
    colorPalette: z
        .object({
            primary: z.array(z.string()),
            accent: z.array(z.string()),
            atmosphere: z.array(z.string()),
        })
        .nullable(),
});

/**
 * TypeScript type for generated setting data (AI output)
 */
export type GeneratedSettingData = z.infer<typeof GeneratedSettingSchema>;

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

/**
 * Minimal schema for part generation (only fields AI generates)
 * Manually defined to avoid Gemini JSON schema validation issues with complex fields
 * Fields must match insertPartSchema but without database-specific fields
 */
export const GeneratedPartSchema = z.object({
    title: z.string().max(255),
    summary: z.string().nullable(),
    characterArcs: z.array(characterArcSchema).nullable(),
});

/**
 * TypeScript type for generated part data (AI output)
 */
export type GeneratedPartData = z.infer<typeof GeneratedPartSchema>;

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
    virtueType: z.enum(CORE_TRAITS),
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

/**
 * Minimal schema for chapter generation (only fields AI generates)
 * Manually defined to avoid Gemini JSON schema validation issues with complex fields
 * Fields must match insertChapterSchema but without database-specific fields
 */
export const GeneratedChapterSchema = z.object({
    title: z.string().max(255),
    summary: z.string().nullable(),
    arcPosition: z
        .enum(["beginning", "middle", "climax", "resolution"])
        .nullable(),
    contributesToMacroArc: z.string().nullable(),
    focusCharacters: z.array(z.string()).nullable(),
    adversityType: z.enum(["internal", "external", "both"]).nullable(),
    virtueType: z.enum(CORE_TRAITS).nullable(),
    seedsPlanted: z.array(seedPlantedSchema).nullable(),
    seedsResolved: z.array(seedResolvedSchema).nullable(),
    connectsToPreviousChapter: z.string().nullable(),
    createsNextAdversity: z.string().nullable(),
});

/**
 * TypeScript type for generated chapter data (AI output)
 */
export type GeneratedChapterData = z.infer<typeof GeneratedChapterSchema>;

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

/**
 * Minimal schema for scene summary generation (only fields AI generates)
 * Manually defined to avoid Gemini JSON schema validation issues with complex fields
 * Fields must match insertSceneSchema but without database-specific fields
 */
export const GeneratedSceneSummarySchema = z.object({
    title: z.string().max(255),
    summary: z.string().nullable(),
    cyclePhase: z
        .enum(["setup", "confrontation", "virtue", "consequence", "transition"])
        .nullable(),
    emotionalBeat: z
        .enum([
            "fear",
            "hope",
            "tension",
            "relief",
            "elevation",
            "catharsis",
            "despair",
            "joy",
        ])
        .nullable(),
    characterFocus: z.array(z.string()).nullable(),
    settingId: z.string().nullable(),
    sensoryAnchors: z.array(z.string()).nullable(),
    dialogueVsDescription: z.string().nullable(),
    suggestedLength: z.enum(["short", "medium", "long"]).nullable(),
});

/**
 * TypeScript type for generated scene summary data (AI output)
 */
export type GeneratedSceneSummaryData = z.infer<
    typeof GeneratedSceneSummarySchema
>;

// ============================================================================
// Scene Evaluation Schemas
// ============================================================================

/**
 * Minimal schema for scene evaluation output (AI generates)
 * Used by scene-evaluation-generator to parse evaluation JSON
 */
export const GeneratedSceneEvaluationSchema = z.object({
    plot: z.number().min(1).max(4),
    character: z.number().min(1).max(4),
    pacing: z.number().min(1).max(4),
    prose: z.number().min(1).max(4),
    worldBuilding: z.number().min(1).max(4),
    overallScore: z.number().min(1).max(4),
    feedback: z.string(),
    suggestedImprovements: z.string(),
});

/**
 * TypeScript type for scene evaluation data (AI output)
 */
export type GeneratedSceneEvaluationData = z.infer<
    typeof GeneratedSceneEvaluationSchema
>;

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

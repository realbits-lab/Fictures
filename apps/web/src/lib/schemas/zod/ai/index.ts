/**
 * AI Schemas - Derived from generated validators with AI-specific metadata
 *
 * These schemas are derived from generated-zod validators using .pick() and .extend().
 * They include only AI-generated fields with enhanced descriptions for AI models.
 *
 * SSOT Flow: Generated Validators → .pick() → .extend() with descriptions → AI Schemas
 */

import { z } from "zod";
import {
    ADVERSITY_TYPES,
    CHAPTER_ARC_POSITIONS,
} from "@/lib/constants/arc-positions";
import { CHARACTER_ROLES } from "@/lib/constants/character-roles";
import { CORE_TRAITS } from "@/lib/constants/core-traits";
import { CYCLE_PHASES } from "@/lib/constants/cycle-phases";
import { EMOTIONAL_BEATS } from "@/lib/constants/emotional-beats";
import { STORY_GENRES } from "@/lib/constants/genres";
import { STORY_TONES } from "@/lib/constants/tones";
import {
    insertChapterSchema,
    insertCharacterSchema,
    insertPartSchema,
    insertSceneSchema,
    insertSettingSchema,
    insertStorySchema,
    SUGGESTED_LENGTHS,
} from "@/lib/schemas/zod/generated";
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
// Story AI Schema
// ============================================================================

/**
 * AI-generated story fields schema
 * Derived from insertStorySchema (SSOT) using .pick()
 * Picks only fields that AI generates, adds descriptions for Gemini
 */
export const AiStoryZodSchema = insertStorySchema
    .pick({
        title: true,
        summary: true,
        genre: true,
        tone: true,
        moralFramework: true,
    })
    .extend({
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
 * TypeScript type for AI-generated story data (derived from Zod schema)
 */
export type AiStoryType = z.infer<typeof AiStoryZodSchema>;

// ============================================================================
// Character AI Schema
// ============================================================================

/**
 * AI-generated character fields schema
 * Derived from insertCharacterSchema (SSOT) using .pick()
 * Picks only fields that AI generates, adds descriptions for Gemini
 */
export const AiCharacterZodSchema = insertCharacterSchema
    .pick({
        name: true,
        role: true,
        isMain: true,
        summary: true,
        coreTrait: true,
        internalFlaw: true,
        externalGoal: true,
        personality: true,
        backstory: true,
        physicalDescription: true,
        voiceStyle: true,
    })
    .extend({
        name: z
            .string()
            .max(255)
            .describe(
                "Character's full name - should be memorable and fit the genre",
            ),
        role: z
            .enum(CHARACTER_ROLES as [string, ...string[]])
            .describe(
                "Character's narrative role - must be one of: protagonist (main hero), deuteragonist (second most important), tritagonist (third most important), antagonist (opposes protagonist), supporting (assists narrative without major arc)",
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
 * TypeScript type for AI-generated character data (derived from Zod schema)
 */
export type AiCharacterType = z.infer<typeof AiCharacterZodSchema>;

// ============================================================================
// Setting AI Schema
// ============================================================================

/**
 * AI-generated setting fields schema
 * Derived from insertSettingSchema (SSOT) using .pick()
 * Picks only fields that AI generates, adds descriptions for Gemini
 */
export const AiSettingZodSchema = insertSettingSchema
    .pick({
        name: true,
        summary: true,
        adversityElements: true,
        virtueElements: true,
        consequenceElements: true,
        symbolicMeaning: true,
        mood: true,
        emotionalResonance: true,
        sensory: true,
        architecturalStyle: true,
        visualReferences: true,
        colorPalette: true,
    })
    .extend({
        name: z
            .string()
            .max(255)
            .describe(
                "Setting name: The Last Garden, Refugee Camp, Downtown Market",
            ),
        summary: z
            .string()
            .describe(
                "Comprehensive paragraph (3-5 sentences) describing the setting's physical and emotional characteristics",
            ),
        adversityElements: adversityElementsSchema.describe(
            "External conflict sources from the environment that create obstacles for characters",
        ),
        virtueElements: virtueElementsSchema.describe(
            "Elements that amplify virtuous actions and moral elevation: witnesses, contrasts, opportunities, sacred spaces",
        ),
        consequenceElements: consequenceElementsSchema.describe(
            "Elements that manifest earned rewards and karmic payoffs: transformations, reward sources, revelations, community responses",
        ),
        symbolicMeaning: z
            .string()
            .describe(
                "How setting reflects story's moral framework (1-2 sentences): Destroyed city represents broken trust and loss of community",
            ),
        mood: z
            .string()
            .describe(
                "Primary emotional quality: oppressive and surreal, hopeful but fragile, tense and uncertain",
            ),
        emotionalResonance: z
            .string()
            .describe(
                "What emotion this setting amplifies: isolation, hope, fear, connection, despair",
            ),
        sensory: sensorySchema.describe(
            "Concrete sensory details for show-don't-tell prose writing",
        ),
        architecturalStyle: z
            .string()
            .describe(
                "Structural design language if applicable: brutalist concrete, traditional wooden, modern glass and steel",
            ),
        visualReferences: z
            .array(z.string())
            .describe(
                "Style inspirations: Blade Runner 2049, Studio Ghibli countryside, Mad Max Fury Road",
            ),
        colorPalette: z
            .array(z.string())
            .describe(
                "Dominant colors: warm golds, dusty browns, deep greens, ash gray, rust red",
            ),
    });

/**
 * TypeScript type for generated setting data (AI output)
 */
export type AiSettingType = z.infer<typeof AiSettingZodSchema>;

// ============================================================================
// Part AI Schema
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
        .enum(["primary", "secondary"])
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
 * AI-generated part fields schema
 * Derived from insertPartSchema (SSOT) using .pick()
 * Picks only fields that AI generates, adds descriptions for Gemini
 */
export const AiPartZodSchema = insertPartSchema
    .pick({
        title: true,
        summary: true,
        characterArcs: true,
        settingIds: true,
    })
    .extend({
        title: z
            .string()
            .max(255)
            .describe(
                "Part title - should reflect the major story arc or theme of this section",
            ),
        summary: z
            .string()
            .describe(
                "2-3 sentence overview of this part's narrative arc and character development",
            ),
        characterArcs: z
            .array(characterArcSchema)
            .describe(
                "Collection of character development arcs that unfold during this part",
            ),
        settingIds: z
            .array(z.string())
            .describe(
                "Array of setting IDs selected from Story.settings (2-4 settings) that are used in this Part",
            ),
    });

/**
 * TypeScript type for generated part data (AI output)
 */
export type AiPartType = z.infer<typeof AiPartZodSchema>;

// ============================================================================
// Chapter AI Schema
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
 * AI-generated chapter fields schema
 * Derived from insertChapterSchema (SSOT) using .pick()
 * Picks only fields that AI generates, adds descriptions for Gemini
 */
export const AiChapterZodSchema = insertChapterSchema
    .pick({
        title: true,
        summary: true,
        arcPosition: true,
        contributesToMacroArc: true,
        characterArc: true,
        focusCharacters: true,
        adversityType: true,
        virtueType: true,
        settingIds: true,
        seedsPlanted: true,
        seedsResolved: true,
        connectsToPreviousChapter: true,
        createsNextAdversity: true,
    })
    .extend({
        title: z
            .string()
            .max(255)
            .describe("Chapter title - engaging and descriptive"),
        summary: z
            .string()
            .describe(
                "2-3 sentence overview of the chapter's events and character development",
            ),
        arcPosition: z
            .enum(CHAPTER_ARC_POSITIONS as unknown as [string, ...string[]])
            .describe(
                "Position in the macro story arc - must be one of: beginning, middle, climax, resolution",
            ),
        contributesToMacroArc: z
            .string()
            .describe(
                "How this chapter advances the overall story arc and character development",
            ),
        characterArc: chapterCharacterArcSchema.describe(
            "Structured micro-cycle tracking: characterId, microAdversity (internal/external), microVirtue, microConsequence, microNewAdversity",
        ),
        focusCharacters: z
            .array(z.string())
            .describe(
                "Array of character IDs who are the primary focus of this chapter",
            ),
        adversityType: z
            .enum(ADVERSITY_TYPES as unknown as [string, ...string[]])
            .describe(
                "Type of adversity faced - must be one of: internal (psychological), external (physical/social), or both",
            ),
        virtueType: z
            .enum(CORE_TRAITS)
            .describe(
                "Core virtue demonstrated in this chapter - must be one of: courage, compassion, integrity, loyalty, wisdom, sacrifice",
            ),
        settingIds: z
            .array(z.string())
            .describe(
                "Array of setting IDs selected from Part.settingIds (1-3 settings) that are used in this Chapter",
            ),
        seedsPlanted: z
            .array(seedPlantedSchema)
            .describe(
                "Narrative elements introduced in this chapter for future payoff",
            ),
        seedsResolved: z
            .array(seedResolvedSchema)
            .describe(
                "Previously planted seeds that are resolved in this chapter",
            ),
        connectsToPreviousChapter: z
            .string()
            .describe(
                "How this chapter connects to and builds on the previous one",
            ),
        createsNextAdversity: z
            .string()
            .describe(
                "New adversity or complication introduced for the next chapter",
            ),
    });

/**
 * TypeScript type for generated chapter data (AI output)
 */
export type AiChapterType = z.infer<typeof AiChapterZodSchema>;

// ============================================================================
// Scene Summary AI Schema
// ============================================================================

/**
 * AI-generated scene summary fields schema
 * Derived from insertSceneSchema (SSOT) using .pick()
 * Picks only fields that AI generates, adds descriptions for Gemini
 */
export const AiSceneSummaryZodSchema = insertSceneSchema
    .pick({
        title: true,
        summary: true,
        cyclePhase: true,
        emotionalBeat: true,
        characterFocus: true,
        settingId: true,
        sensoryAnchors: true,
        dialogueVsDescription: true,
        suggestedLength: true,
    })
    .extend({
        title: z
            .string()
            .max(255)
            .describe("Scene title - descriptive and engaging"),
        summary: z
            .string()
            .describe(
                "Scene specification: what happens, emotional beat, purpose, and key moments",
            ),
        cyclePhase: z
            .enum(CYCLE_PHASES)
            .describe(
                "Position in adversity-triumph cycle - MUST match scene number: Scene 1='setup', Scene 2='adversity', Scene 3='virtue', Scene 4='consequence', Scene 5+='transition'. This ensures proper 5-phase cycle structure.",
            ),
        emotionalBeat: z
            .enum(EMOTIONAL_BEATS)
            .describe(
                "Target emotional response - must be one of: fear (dread/anxiety), hope (optimism/possibility), tension (conflict/suspense), relief (resolution/safety), elevation (moral inspiration), catharsis (emotional release), despair (loss/hopelessness), joy (happiness/triumph)",
            ),
        characterFocus: z
            .array(z.string())
            .describe(
                "Array of character IDs who are the primary focus of this scene",
            ),
        settingId: z
            .string()
            .describe(
                "Setting ID where this scene takes place (references Setting.id)",
            ),
        sensoryAnchors: z
            .array(z.string())
            .describe(
                "Concrete sensory details to ground the scene (sight, sound, smell, touch, taste) - specific and evocative for show-don't-tell prose",
            ),
        dialogueVsDescription: z
            .string()
            .describe(
                'Balance guidance for prose generation - format: "X% dialogue, Y% description" - example: "60% dialogue, 40% description" or "dialogue-heavy" or "description-focused"',
            ),
        suggestedLength: z
            .enum(SUGGESTED_LENGTHS)
            .describe(
                "Recommended word count - must be one of: short (300-500 words), medium (500-800 words), long (800-1000 words)",
            ),
    });

/**
 * TypeScript type for generated scene summary data (AI output)
 */
export type AiSceneSummaryType = z.infer<typeof AiSceneSummaryZodSchema>;

// ============================================================================
// Scene Improvement AI Schema
// ============================================================================

/**
 * Minimal schema for scene improvement output (AI generates)
 * Used by scene-improvement-generator to parse evaluation JSON
 *
 * Based on "Architectonics of Engagement" framework for scene quality assessment
 * Scoring Scale: 1 (Nascent) → 2 (Developing) → 3 (Effective/PASSING) → 4 (Exemplary)
 */
export const AiSceneImprovementZodSchema = z.object({
    plot: z
        .number()
        .min(1)
        .max(4)
        .describe(
            "Plot quality score (1-4): Evaluates goal clarity, conflict engagement, and stakes progression. Score 3+ = clear dramatic goal with compelling conflict and evident stakes",
        ),
    character: z
        .number()
        .min(1)
        .max(4)
        .describe(
            "Character quality score (1-4): Evaluates voice distinctiveness, motivation clarity, and emotional authenticity. Score 3+ = unique character voices with clear motivations and genuine emotions",
        ),
    pacing: z
        .number()
        .min(1)
        .max(4)
        .describe(
            "Pacing quality score (1-4): Evaluates tension modulation, scene rhythm, and narrative momentum. Score 3+ = tension rises and falls strategically with engaging pace that propels story forward",
        ),
    prose: z
        .number()
        .min(1)
        .max(4)
        .describe(
            "Prose quality score (1-4): Evaluates sentence variety, word choice precision, and sensory engagement. Score 3+ = varied sentences, precise words, and multiple senses engaged",
        ),
    worldBuilding: z
        .number()
        .min(1)
        .max(4)
        .describe(
            "World-building quality score (1-4): Evaluates setting integration, detail balance, and immersion. Score 3+ = setting supports and enhances action with enriching details",
        ),
    overallScore: z
        .number()
        .min(1)
        .max(4)
        .describe(
            "Overall scene quality score (1-4): Average of the five category scores. Score 3.0+ = PASSING (professionally crafted, ready for publication). Below 3.0 = needs improvement",
        ),
    feedback: z
        .string()
        .describe(
            "General qualitative feedback on the scene's strengths and areas for improvement - should be constructive and specific",
        ),
    suggestedImprovements: z
        .string()
        .describe(
            "Specific, actionable improvement suggestions if score < 3.0 - should point to exact sentences or sections with concrete fixes, prioritizing 1-3 high-impact changes",
        ),
});

/**
 * TypeScript type for scene improvement data (AI output)
 */
export type AiSceneImprovementType = z.infer<
    typeof AiSceneImprovementZodSchema
>;

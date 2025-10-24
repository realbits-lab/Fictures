/**
 * Hierarchical Narrative Schema (HNS) Type Definitions
 * Based on the comprehensive story specification document
 * Using Zod as the single source of truth
 */

import { z } from "zod";

// ============================================
// ZOD SCHEMAS - Single Source of Truth
// ============================================

// Level 1: Overall Narrative Schema
/**
 * Story represents the complete narrative at its most abstract level.
 * Contains the core conceptual DNA of the work, serving as the foundational
 * input for the entire generation process.
 */
export const HNSStorySchema = z.object({
  /** Unique identifier (UUID) for database management */
  story_id: z.string().describe("Unique identifier for database management and tracking"),

  /** The working or final title of the story */
  story_title: z.string().describe("The working or final title of the story"),

  /** Array specifying primary and secondary genres (e.g., ['urban_fantasy', 'thriller']) */
  genre: z.array(z.string()).min(1).max(3)
    .describe("Primary and secondary genres informing stylistic choices in text and image generation"),

  /** Single succinct sentence (under 20 words) encapsulating the entire novel */
  premise: z.string().max(200)
    .describe("One-sentence summary tying together big-picture conflict with personal stakes (max 20 words)"),

  /** Central yes-or-no question driving the narrative, answered in the climax */
  dramatic_question: z.string()
    .describe("The central yes/no question that drives the narrative and must be answered in the climax"),

  /** Concise statement of the story's central message for thematic coherence */
  theme: z.string()
    .describe("Concise statement of the story's central message to guide narrative coherence"),

  /** Array of character_ids linking to all major and minor characters */
  characters: z.array(z.string()).default([])
    .describe("References to all Character objects in the story"),

  /** Array of setting_ids for all key locations in the story world */
  settings: z.array(z.string()).default([])
    .describe("References to all Setting objects used in the story"),

  /** Array of part_ids representing major structural divisions (typically three acts) */
  parts: z.array(z.string()).default([])
    .describe("References to Part objects representing major structural divisions (typically three acts)"),
});

// Level 2: Major Sections Schema
/**
 * Parts represent major thematic or narrative divisions within the overall story.
 * Typically correspond to acts in traditional dramatic structure, ensuring the
 * story follows proven dramatic arcs.
 */
export const HNSPartSchema = z.object({
  /** Unique identifier for the part */
  part_id: z.string().describe("Unique identifier for the part"),

  /** Descriptive title for the act (e.g., 'Part I: Discovery') */
  part_title: z.string().describe("Descriptive title for the act"),

  /** Maps the part to its function within Three-Act Structure */
  structural_role: z.enum([
    "Act 1: Setup",        // Introduces characters, establishes ordinary world, presents inciting incident
    "Act 2: Confrontation", // Develops rising action, presents obstacles, builds to climax
    "Act 3: Resolution",    // Resolves conflicts, completes character arcs, provides closure
  ]).describe("Part's function within recognized narrative framework"),

  /** One-paragraph summary describing main movements and developments */
  summary: z.string()
    .describe("One-paragraph summary of main movements and developments within this act"),

  /** Array of crucial plot points for automated validation */
  key_beats: z.array(z.string())
    .describe("Critical plot points (e.g., 'Inciting Incident', 'Midpoint', 'Climax') for structural validation"),

  /** Ordered array of chapter_ids comprising this part */
  chapters: z.array(z.string()).default([])
    .describe("Ordered references to Chapter objects that comprise this part"),

  /** Number of chapters to generate for this part (1-3) */
  chapter_count: z.number().min(1).max(3).default(1)
    .describe("Number of chapters to generate for this part"),

  /** Number of scenes to generate per chapter (array with one value per chapter, 1-3 each) */
  scene_counts: z.array(z.number().min(1).max(3)).default([1])
    .describe("Number of scenes per chapter in this part"),
});

// Level 3: Reading Units Schema
/**
 * Chapter is the primary unit of reader consumption, especially critical in web novel format.
 * Must balance being self-contained reading experiences while advancing the larger
 * narrative through carefully designed hooks and pacing.
 */
export const HNSChapterSchema = z.object({
  /** Unique identifier for the chapter */
  chapter_id: z.string().describe("Unique identifier for the chapter"),

  /** Sequential number of the chapter within the story */
  chapter_number: z.number().describe("Sequential position within the story"),

  /** The title of the chapter */
  chapter_title: z.string().describe("Descriptive title for the chapter"),

  /** Reference to the parent Part this chapter belongs to */
  part_ref: z.string().describe("Link to parent Part object"),

  /** Detailed one-paragraph summary corresponding to expanded Snowflake Method paragraphs */
  summary: z.string()
    .describe("Detailed paragraph of chapter events, expanded from Snowflake Method"),

  /** Dictates intended tempo for procedural text generation */
  pacing_goal: z
    .enum(["fast", "medium", "slow", "reflective"])
    .default("medium")
    .describe("Intended tempo to guide prose style, sentence length, and narrative rhythm"),

  /** Percentage ratio of action to dialogue (e.g., '40:60') */
  action_dialogue_ratio: z.string().default("50:50")
    .describe("Balance specification for narrative composition (e.g., '40:60' for action:dialogue)"),

  /** Structured end-of-chapter hook critical for reader retention in serialized fiction */
  chapter_hook: z.object({
    /** Nature of the hook determining reader anticipation type */
    type: z.enum([
      "revelation",              // New information that changes everything
      "danger",                  // Immediate threat or peril
      "decision",                // Critical choice point
      "question",                // Mystery or uncertainty
      "emotional_turning_point",  // Major character moment
    ]).describe("Nature of the hook for reader retention"),

    /** Brief sentence describing the specific hook content */
    description: z.string().describe("Specific hook content"),

    /** Urgency level affecting reader compulsion to continue */
    urgency_level: z.enum(["high", "medium", "low"])
      .describe("Urgency driving immediate continuation"),
  }).describe("End-of-chapter hook structure for serialized fiction"),

  /** Ordered array of scene_ids making up the chapter */
  scenes: z.array(z.string()).default([])
    .describe("Ordered references to Scene objects comprising this chapter"),
});

// Level 4: Individual Scenes Schema
/**
 * Scene is a unit of change following the Scene-Sequel model.
 * Each scene must create meaningful change in a character's situation,
 * either externally or internally, forming an unbreakable chain of cause and effect.
 */
export const HNSSceneSchema = z.object({
  /** Unique identifier for the scene */
  scene_id: z.string().describe("Unique identifier for the scene"),

  /** Sequential number of the scene within the chapter */
  scene_number: z.number().describe("Sequential position within the chapter"),

  /** Descriptive title for the scene that captures its essence or key event */
  scene_title: z.string().describe("Descriptive title for the scene that captures its essence or key event"),

  /** Reference to the parent Chapter this scene belongs to */
  chapter_ref: z.string().describe("Link to parent Chapter object"),

  /** Array of all characters present or referenced in the scene */
  character_ids: z.array(z.string()).default([])
    .describe("All Character objects present or referenced in the scene"),

  /** Link to the specific Setting where the scene takes place */
  setting_id: z.string().describe("Reference to Setting object for scene location"),

  /** Character from whose perspective the scene is told */
  pov_character_id: z.string()
    .describe("POV character determining narrative perspective and internal access"),

  /** Narrative perspective for prose generation */
  narrative_voice: z
    .enum(["third_person_limited", "first_person", "third_person_omniscient"])
    .default("third_person_limited")
    .describe("Narrative perspective guiding prose generation"),

  /** One-sentence description of the scene's core action or purpose */
  summary: z.string()
    .describe("One-sentence description of core action or purpose"),

  /** Opening line or action for immediate reader engagement */
  entry_hook: z.string()
    .describe("Opening line or action designed for immediate engagement"),

  /** Clear statement of what the POV character wants to achieve (Scene-Sequel model) */
  goal: z.string()
    .describe("POV character's specific, immediate objective in the scene"),

  /** Obstacle preventing easy achievement of goal (Scene-Sequel model) */
  conflict: z.string()
    .describe("Internal or external obstacle preventing goal achievement"),

  /** Result of the conflict driving plot forward (Scene-Sequel model) */
  outcome: z.enum([
    "success",               // Goal achieved as intended
    "failure",               // Complete failure to achieve goal
    "success_with_cost",     // Goal achieved but with negative consequences
    "failure_with_discovery", // Failed but learned something important
  ]).describe("Result driving plot into next scene"),

  /** Tracks character arc through emotional progression */
  emotional_shift: z.object({
    /** POV character's emotional state at scene beginning */
    from: z.string().describe("Starting emotional state"),
    /** POV character's emotional state at scene end */
    to: z.string().describe("Ending emotional state"),
  }).describe("Change in POV character's emotional state for arc tracking"),

  /** Generated narrative content for the scene (2-3 opening paragraphs) */
  content: z.string().optional()
    .describe("Opening narrative content (2-3 paragraphs) written in the specified narrative voice and POV"),

  /** Scene visualization data */
  scene_image: z.object({
    prompt: z.string().describe("Image generation prompt based on scene content"),
    url: z.string().optional().describe("URL of generated image stored in Vercel Blob"),
    style: z.string().default("cinematic").describe("Visual style for the scene image"),
    mood: z.string().describe("Visual mood/atmosphere for the scene"),
    generated_at: z.string().optional().describe("Timestamp of image generation")
  }).optional().describe("Scene visualization data for image generation"),
});

// Cross-Level: Character Identity and Context Schema
/**
 * Character is the fundamental human element driving narrative engagement.
 * Contains comprehensive psychological, physical, and narrative data
 * optimized for both prose generation and visual consistency.
 */
export const HNSCharacterSchema = z.object({
  /** Unique identifier for the character */
  character_id: z.string().describe("Unique identifier for database management"),

  /** The character's name */
  name: z.string().describe("Character's full name"),

  /** Character's narrative function in the story */
  role: z.enum(["protagonist", "antagonist", "mentor", "ally", "neutral"])
    .describe("Narrative role determining story function"),

  /** Character pattern (e.g., 'reluctant_hero', 'trickster', 'mentor') */
  archetype: z.string()
    .describe("Archetypal pattern informing character behavior and arc"),

  /** Brief description of character and their story role */
  summary: z.string()
    .describe("Physical appearance and initial impression"),

  /** Character's complete narrative journey through the story */
  storyline: z.string()
    .describe("Character's journey and arc through the narrative"),

  /** Structured personality profile for consistent characterization */
  personality: z.object({
    /** Array of defining personality characteristics */
    traits: z.array(z.string()).describe("Core personality traits"),
    /** Myers-Briggs Type Indicator (e.g., 'INTJ') */
    myers_briggs: z.string().describe("MBTI personality type"),
    /** Enneagram type (e.g., 'Type 5 - Investigator') */
    enneagram: z.string().describe("Enneagram personality designation"),
  }).describe("Psychological profile for behavioral consistency"),

  /** Character history informing motivations and behavior */
  backstory: z.object({
    /** Formative years and key childhood events */
    childhood: z.string().describe("Formative experiences"),
    /** Academic and training background */
    education: z.string().describe("Educational history"),
    /** Professional history and expertise */
    career: z.string().describe("Work and professional background"),
    /** Key connections and bonds */
    relationships: z.string().describe("Important relationships"),
    /** Defining wounds or losses */
    trauma: z.string().describe("Core wounds shaping character"),
  }).describe("Historical context informing present behavior"),

  /** What drives the character's actions throughout the story */
  motivations: z.object({
    /** Main driving goal */
    primary: z.string().describe("Core driving force"),
    /** Supporting objectives */
    secondary: z.string().describe("Additional goals"),
    /** Core anxieties and dreads */
    fear: z.string().describe("Deepest fear to overcome or succumb to"),
  }).describe("Driving forces behind character decisions"),

  /** Communication style for dialogue generation */
  voice: z.object({
    /** How they structure sentences */
    speech_pattern: z.string().describe("Sentence structure tendencies"),
    /** Word choice and education level */
    vocabulary: z.string().describe("Vocabulary level and preferences"),
    /** Repeated phrases or expressions */
    verbal_tics: z.array(z.string()).describe("Characteristic expressions"),
    /** Thought patterns and self-talk */
    internal_voice: z.string().describe("Internal monologue style"),
  }).describe("Linguistic patterns for dialogue generation"),

  /** Detailed physical attributes optimized for AI image generation */
  physical_description: z.object({
    /** Character's age as number */
    age: z.number().describe("Age in years"),
    /** Cultural/ethnic background */
    ethnicity: z.string().describe("Ethnic/cultural background"),
    /** Physical stature */
    height: z.string().describe("Height description"),
    /** Body type and physique */
    build: z.string().describe("Physical build and body type"),
    /** Hair appearance details */
    hair_style_color: z.string().describe("Hair style and color"),
    /** Eye characteristics including magical changes */
    eye_color: z.string().describe("Eye color and notable features"),
    /** Distinctive face characteristics */
    facial_features: z.string().describe("Notable facial characteristics"),
    /** Unique physical identifiers */
    distinguishing_marks: z.string().describe("Scars, birthmarks, or unique features"),
    /** Standard clothing and accessories */
    typical_attire: z.string().describe("Common clothing style"),
  }).describe("Physical attributes for visual generation prompts"),

  /** Reference to visual asset file for consistency */
  visual_reference_id: z.string().optional()
    .describe("Link to generated character image for visual consistency"),
});

// Cross-Level: Location Context Schema
/**
 * Settings define specific locations within the story world.
 * Contains sensory details for immersive prose generation and
 * visual specifications for consistent environmental visualization.
 */
export const HNSSettingSchema = z.object({
  /** Unique identifier for the setting */
  setting_id: z.string().describe("Unique identifier for the location"),

  /** Location designation (e.g., 'The Shadow Realm', 'Maya's Apartment') */
  name: z.string().describe("Clear, memorable location name"),

  /** Comprehensive paragraph describing location's nature and characteristics */
  description: z.string()
    .describe("Detailed description of the location's appearance and atmosphere"),

  /** Atmospheric quality (e.g., 'oppressive and surreal', 'cozy and welcoming') */
  mood: z.string()
    .describe("Emotional atmosphere that influences scene tone"),

  /** Structured sensory details for complete environmental immersion */
  sensory: z.object({
    /** Visual descriptions for scene setting */
    sight: z.array(z.string())
      .describe("Visual elements like 'shadows moving independently')"),
    /** Auditory elements for atmosphere */
    sound: z.array(z.string())
      .describe("Ambient sounds like 'whispers in unknown languages')"),
    /** Olfactory details for immersion */
    smell: z.array(z.string())
      .describe("Scents like 'ozone and old paper')"),
    /** Tactile sensations for physical presence */
    touch: z.array(z.string())
      .describe("Physical sensations like 'air thick like water')"),
    /** Flavor elements when relevant */
    taste: z.array(z.string()).optional()
      .describe("Taste sensations like 'metallic undertone to the air')"),
  }).describe("Five-sense arrays for immersive prose generation"),

  /** Artistic direction for visual generation (e.g., 'dark fantasy horror') */
  visual_style: z.string()
    .describe("Overall artistic style for image generation"),

  /** Style inspirations for artistic consistency */
  visual_references: z.array(z.string())
    .describe("Reference styles like 'HR Giger', 'Studio Ghibli'"),

  /** Dominant colors for visual coherence */
  color_palette: z.array(z.string())
    .describe("Color scheme like 'deep purples', 'silver highlights'"),

  /** Structural design language (e.g., 'Gothic mixed with non-Euclidean geometry') */
  architectural_style: z.string()
    .describe("Architectural design maintaining spatial coherence"),
});

// Complete HNS Document Schema
/**
 * Complete Hierarchical Narrative Schema document containing
 * all story elements in a structured, interconnected format.
 * Enables systematic story creation, validation, and evaluation.
 */
export const HNSDocumentSchema = z.object({
  /** Core story object with foundational narrative DNA */
  story: HNSStorySchema,
  /** Major structural divisions (typically three acts) */
  parts: z.array(HNSPartSchema),
  /** Reading units with hooks for serialized fiction */
  chapters: z.array(HNSChapterSchema),
  /** Individual scenes following Scene-Sequel model */
  scenes: z.array(HNSSceneSchema),
  /** Complete character profiles with psychological depth */
  characters: z.array(HNSCharacterSchema),
  /** Immersive locations with sensory details */
  settings: z.array(HNSSettingSchema),
});

// ============================================
// PARTIAL SCHEMAS for AI Generation
// ============================================

// These partial schemas are useful for AI generation where IDs might be optional
export const HNSStoryPartialSchema = HNSStorySchema.partial({
  story_id: true,
});

export const HNSPartPartialSchema = HNSPartSchema.partial({
  part_id: true,
});

export const HNSChapterPartialSchema = HNSChapterSchema.partial({
  chapter_id: true,
  chapter_number: true,
  part_ref: true,
});

export const HNSScenePartialSchema = HNSSceneSchema.partial({
  scene_id: true,
  scene_number: true,
  scene_title: true,
  chapter_ref: true,
  setting_id: true,
  pov_character_id: true,
  scene_image: true,
});

export const HNSCharacterPartialSchema = HNSCharacterSchema.partial({
  character_id: true,
  visual_reference_id: true,
});

export const HNSSettingPartialSchema = HNSSettingSchema.partial({
  setting_id: true,
});

// ============================================
// TYPESCRIPT TYPES - Derived from Zod Schemas
// ============================================

// Level 1: Overall Narrative
export type HNSStory = z.infer<typeof HNSStorySchema>;

// Level 2: Major Sections
export type HNSPart = z.infer<typeof HNSPartSchema>;

// Level 3: Reading Units
export type HNSChapter = z.infer<typeof HNSChapterSchema>;

// Level 4: Individual Scenes
export type HNSScene = z.infer<typeof HNSSceneSchema>;

// Cross-Level: Character Identity and Context
export type HNSCharacter = z.infer<typeof HNSCharacterSchema>;

// Cross-Level: Location Context
export type HNSSetting = z.infer<typeof HNSSettingSchema>;

// Complete HNS Document
export type HNSDocument = z.infer<typeof HNSDocumentSchema>;

// Partial types for AI generation
export type HNSStoryPartial = z.infer<typeof HNSStoryPartialSchema>;
export type HNSPartPartial = z.infer<typeof HNSPartPartialSchema>;
export type HNSChapterPartial = z.infer<typeof HNSChapterPartialSchema>;
export type HNSScenePartial = z.infer<typeof HNSScenePartialSchema>;
export type HNSCharacterPartial = z.infer<typeof HNSCharacterPartialSchema>;
export type HNSSettingPartial = z.infer<typeof HNSSettingPartialSchema>;

// ============================================
// HELPER CONSTANTS & TYPES
// ============================================

// Helper types for key beats
export const ACT1_BEATS = ['Exposition', 'Inciting Incident', 'Plot Point One'] as const;
export const ACT2_BEATS = ['Rising Action', 'Midpoint', 'Plot Point Two'] as const;
export const ACT3_BEATS = ['Climax', 'Falling Action', 'Resolution'] as const;

export type Act1Beat = typeof ACT1_BEATS[number];
export type Act2Beat = typeof ACT2_BEATS[number];
export type Act3Beat = typeof ACT3_BEATS[number];
export type KeyBeat = Act1Beat | Act2Beat | Act3Beat;

// ============================================
// VALIDATION HELPERS
// ============================================

export function validateStoryPremise(premise: string): boolean {
  return premise.split(' ').length <= 20;
}

export function validateChapterHook(hook: HNSChapter['chapter_hook']): boolean {
  const validTypes = ['revelation', 'danger', 'decision', 'question', 'emotional_turning_point'];
  const validUrgency = ['high', 'medium', 'low'];
  return validTypes.includes(hook.type) && validUrgency.includes(hook.urgency_level);
}

export function validateSceneOutcome(outcome: HNSScene['outcome']): boolean {
  const validOutcomes = ['success', 'failure', 'success_with_cost', 'failure_with_discovery'];
  return validOutcomes.includes(outcome);
}

// ============================================
// GENERATION TEMPLATES
// ============================================

export function createEmptyStory(id: string): HNSStory {
  return {
    story_id: id,
    story_title: '',
    genre: [],
    premise: '',
    dramatic_question: '',
    theme: '',
    characters: [],
    settings: [],
    parts: []
  };
}

export function createEmptyPart(id: string, role: HNSPart['structural_role']): HNSPart {
  return {
    part_id: id,
    part_title: '',
    structural_role: role,
    summary: '',
    key_beats: role === 'Act 1: Setup' ? [...ACT1_BEATS] :
                role === 'Act 2: Confrontation' ? [...ACT2_BEATS] :
                [...ACT3_BEATS],
    chapters: [],
    chapter_count: 1,
    scene_counts: [1]
  };
}

export function createEmptyChapter(id: string, number: number, partRef: string): HNSChapter {
  return {
    chapter_id: id,
    chapter_number: number,
    chapter_title: '',
    part_ref: partRef,
    summary: '',
    pacing_goal: 'medium',
    action_dialogue_ratio: '50:50',
    chapter_hook: {
      type: 'question',
      description: '',
      urgency_level: 'medium'
    },
    scenes: []
  };
}

export function createEmptyScene(id: string, number: number, chapterRef: string): HNSScene {
  return {
    scene_id: id,
    scene_number: number,
    scene_title: `Scene ${number}`,
    chapter_ref: chapterRef,
    character_ids: [],
    setting_id: '',
    pov_character_id: '',
    narrative_voice: 'third_person_limited',
    summary: '',
    entry_hook: '',
    goal: '',
    conflict: '',
    outcome: 'success',
    emotional_shift: {
      from: '',
      to: ''
    }
  };
}

// ============================================
// CONVERSION TO JSON SCHEMA (for AI prompts)
// ============================================

/**
 * Convert HNS schemas to JSON Schema format for AI structured output.
 * Enables integration with AI models that require JSON Schema for
 * structured generation (e.g., Gemini's function calling, structured outputs).
 *
 * @param schema - Any Zod schema to convert
 * @returns JSON Schema representation for AI model consumption
 */
export function toJSONSchema(schema: z.ZodType<any>) {
  // Note: This is a placeholder. In production, you might want to use
  // a library like zod-to-json-schema or implement full conversion
  return JSON.parse(JSON.stringify(schema));
}
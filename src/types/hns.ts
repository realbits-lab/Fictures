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
export const HNSStorySchema = z.object({
  story_id: z.string(),
  story_title: z.string(),
  genre: z.array(z.string()).min(1).max(3),
  premise: z.string().max(200),
  dramatic_question: z.string(),
  theme: z.string(),
  characters: z.array(z.string()).default([]),
  settings: z.array(z.string()).default([]),
  parts: z.array(z.string()).default([]),
});

// Level 2: Major Sections Schema
export const HNSPartSchema = z.object({
  part_id: z.string(),
  part_title: z.string(),
  structural_role: z.enum([
    "Act 1: Setup",
    "Act 2: Confrontation",
    "Act 3: Resolution",
  ]),
  summary: z.string(),
  key_beats: z.array(z.string()),
  chapters: z.array(z.string()).default([]),
});

// Level 3: Reading Units Schema
export const HNSChapterSchema = z.object({
  chapter_id: z.string(),
  chapter_number: z.number(),
  chapter_title: z.string(),
  part_ref: z.string(),
  summary: z.string(),
  pacing_goal: z
    .enum(["fast", "medium", "slow", "reflective"])
    .default("medium"),
  action_dialogue_ratio: z.string().default("50:50"),
  chapter_hook: z.object({
    type: z.enum([
      "revelation",
      "danger",
      "decision",
      "question",
      "emotional_turning_point",
    ]),
    description: z.string(),
    urgency_level: z.enum(["high", "medium", "low"]),
  }),
  scenes: z.array(z.string()).default([]),
});

// Level 4: Individual Scenes Schema
export const HNSSceneSchema = z.object({
  scene_id: z.string(),
  scene_number: z.number(),
  chapter_ref: z.string(),
  character_ids: z.array(z.string()).default([]),
  setting_id: z.string(),
  pov_character_id: z.string(),
  narrative_voice: z
    .enum(["third_person_limited", "first_person", "third_person_omniscient"])
    .default("third_person_limited"),
  summary: z.string(),
  entry_hook: z.string(),
  goal: z.string(),
  conflict: z.string(),
  outcome: z.enum([
    "success",
    "failure",
    "success_with_cost",
    "failure_with_discovery",
  ]),
  emotional_shift: z.object({
    from: z.string(),
    to: z.string(),
  }),
});

// Cross-Level: Character Identity and Context Schema
export const HNSCharacterSchema = z.object({
  character_id: z.string(),
  name: z.string(),
  role: z.enum(["protagonist", "antagonist", "mentor", "ally", "neutral"]),
  archetype: z.string(),
  summary: z.string(),
  storyline: z.string(),
  personality: z.object({
    traits: z.array(z.string()),
    myers_briggs: z.string(),
    enneagram: z.string(),
  }),
  backstory: z.object({
    childhood: z.string(),
    education: z.string(),
    career: z.string(),
    relationships: z.string(),
    trauma: z.string(),
  }),
  motivations: z.object({
    primary: z.string(),
    secondary: z.string(),
    fear: z.string(),
  }),
  voice: z.object({
    speech_pattern: z.string(),
    vocabulary: z.string(),
    verbal_tics: z.array(z.string()),
    internal_voice: z.string(),
  }),
  physical_description: z.object({
    age: z.number(),
    ethnicity: z.string(),
    height: z.string(),
    build: z.string(),
    hair_style_color: z.string(),
    eye_color: z.string(),
    facial_features: z.string(),
    distinguishing_marks: z.string(),
    typical_attire: z.string(),
  }),
  visual_reference_id: z.string().optional(),
});

// Cross-Level: Location Context Schema
export const HNSSettingSchema = z.object({
  setting_id: z.string(),
  name: z.string(),
  description: z.string(),
  mood: z.string(),
  sensory: z.object({
    sight: z.array(z.string()),
    sound: z.array(z.string()),
    smell: z.array(z.string()),
    touch: z.array(z.string()),
    taste: z.array(z.string()).optional(),
  }),
  visual_style: z.string(),
  visual_references: z.array(z.string()),
  color_palette: z.array(z.string()),
  architectural_style: z.string(),
});

// Complete HNS Document Schema
export const HNSDocumentSchema = z.object({
  story: HNSStorySchema,
  parts: z.array(HNSPartSchema),
  chapters: z.array(HNSChapterSchema),
  scenes: z.array(HNSSceneSchema),
  characters: z.array(HNSCharacterSchema),
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
  chapter_ref: true,
  setting_id: true,
  pov_character_id: true,
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
    chapters: []
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
 * Convert HNS schemas to JSON Schema format for AI structured output
 */
export function toJSONSchema(schema: z.ZodType<any>) {
  // Note: This is a placeholder. In production, you might want to use
  // a library like zod-to-json-schema or implement full conversion
  return JSON.parse(JSON.stringify(schema));
}
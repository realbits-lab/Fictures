import { z } from 'zod';

// ============================================
// STORY SPECIFICATION SCHEMA (JSON)
// ============================================

export const CharacterSchema = z.object({
  role: z.string().describe('Character role in the story (e.g., protagonist, antagonist, mentor, etc.)'),
  arc: z.string().optional().describe('Character transformation using start→end format'),
  flaw: z.string().optional(),
  goal: z.string().optional(),
  secret: z.string().optional(),
});

export const StructureSchema = z.object({
  type: z.enum(['3_part', '4_part', '5_part']),
  parts: z.array(z.string()),
  dist: z.array(z.number()).optional().describe('Percentage distribution'),
});

export const PartSchema = z.object({
  part: z.number(),
  goal: z.string(),
  conflict: z.string(),
  outcome: z.string(),
  tension: z.string().optional(),
});

export const SerialSchema = z.object({
  schedule: z.enum(['weekly', 'daily', 'monthly']),
  duration: z.string(),
  chapter_words: z.number(),
  breaks: z.array(z.string()),
  buffer: z.string(),
});

export const HooksSchema = z.object({
  overarching: z.array(z.string()),
  mysteries: z.array(z.string()),
  part_endings: z.array(z.string()),
});

export const SettingSchema = z.object({
  primary: z.array(z.string()),
  secondary: z.array(z.string()),
});

export const StorySchema = z.object({
  title: z.string(),
  genre: z.string(),
  words: z.number(),
  question: z.string().describe('Central dramatic question'),
  goal: z.string().describe('What the protagonist wants overall'),
  conflict: z.string().describe('Primary obstacle preventing goal achievement'),
  outcome: z.string().describe('How the central story question resolves'),
  chars: z.record(z.string(), CharacterSchema),
  themes: z.array(z.string()),
  structure: StructureSchema,
  setting: SettingSchema.optional(),
  parts: z.array(PartSchema),
  serial: SerialSchema,
  hooks: HooksSchema,
  language: z.string().default('English'),
});

// ============================================
// PART SPECIFICATION SCHEMA (JSON)
// ============================================

export const PartCharacterSchema = z.object({
  name: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  arc: z.array(z.string()).optional(),
  development: z.string().optional(),
  conflict: z.string().optional(),
  transforms: z.array(z.string()).optional(),
  function: z.string().optional(),
});

export const PartPlotSchema = z.object({
  events: z.array(z.string()).optional(),
  reveals: z.array(z.string()).optional(),
  escalation: z.array(z.string()).optional(),
});

export const PartThemesSchema = z.object({
  primary: z.string(),
  elements: z.array(z.string()),
  moments: z.array(z.string()),
  symbols: z.array(z.string()),
});

export const PartEmotionSchema = z.object({
  start: z.string(),
  progression: z.array(z.string()),
  end: z.string(),
});

export const PartEndingSchema = z.object({
  resolution: z.array(z.string()).optional(),
  setup: z.array(z.string()).optional(),
  hooks: z.array(z.string()).optional(),
  hook_out: z.string().optional(),
});

export const PartSerialSchema = z.object({
  arc: z.string().optional(),
  climax_at: z.string().optional(),
  satisfaction: z.array(z.string()).optional(),
  anticipation: z.array(z.string()).optional(),
  chapter_words: z.number().optional(),
});

export const PartEngagementSchema = z.object({
  discussions: z.array(z.string()),
  speculation: z.array(z.string()),
  debates: z.array(z.string()).optional(),
  feedback: z.array(z.string()).optional(),
});

export const PartQuestionsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
});

export const PartSpecificationSchema = z.object({
  part: z.number(),
  title: z.string(),
  words: z.number().optional(),
  function: z.string().optional(),
  goals: z.string(),
  conflict: z.string(),
  outcome: z.string(),
  questions: PartQuestionsSchema.optional(),
  chars: z.record(z.string(), PartCharacterSchema).optional(),
  plot: PartPlotSchema.optional(),
  themes: PartThemesSchema.optional(),
  emotion: PartEmotionSchema.optional(),
  ending: PartEndingSchema.optional(),
  serial: PartSerialSchema.optional(),
  engagement: PartEngagementSchema.optional(),
});

// ============================================
// CHAPTER SPECIFICATION SCHEMA (JSON)
// ============================================

export const ChapterActsSchema = z.object({
  setup: z.object({
    hook_in: z.string(),
    orient: z.string(),
    incident: z.string(),
  }),
  confrontation: z.object({
    rising: z.string(),
    midpoint: z.string(),
    complicate: z.string(),
  }),
  resolution: z.object({
    climax: z.string(),
    resolve: z.string(),
    hook_out: z.string(),
  }),
});

export const ChapterCharacterSchema = z.object({
  start: z.string(),
  arc: z.string(),
  end: z.string(),
  motivation: z.string(),
  growth: z.string(),
});

export const ChapterTensionSchema = z.object({
  external: z.string(),
  internal: z.string(),
  interpersonal: z.string(),
  atmospheric: z.string(),
  peak: z.string(),
});

export const ChapterMandateSchema = z.object({
  episodic: z.object({
    arc: z.string(),
    payoff: z.string(),
    answered: z.string(),
  }),
  serial: z.object({
    complication: z.string(),
    stakes: z.string(),
    compulsion: z.string(),
  }),
});

export const ChapterHookSchema = z.object({
  type: z.enum(['revelation', 'threat', 'emotional', 'compound']),
  reveal: z.string().optional(),
  threat: z.string().optional(),
  emotion: z.string().optional(),
});

export const ChapterContinuitySchema = z.object({
  foreshadow: z.array(z.string()),
  theories: z.array(z.string()),
});

export const ChapterSpecificationSchema = z.object({
  chap: z.number(),
  title: z.string(),
  pov: z.string(),
  words: z.number(),
  goal: z.string(),
  conflict: z.string(),
  outcome: z.string(),
  acts: ChapterActsSchema,
  chars: z.record(z.string(), ChapterCharacterSchema),
  tension: ChapterTensionSchema,
  mandate: ChapterMandateSchema,
  hook: ChapterHookSchema,
  continuity: ChapterContinuitySchema,
  genre: z.string(),
  pacing: z.string(),
  exposition: z.string(),
});

// ============================================
// SCENE SPECIFICATION SCHEMA (JSON)
// ============================================

export const SceneCharacterSchema = z.object({
  enters: z.string().optional(),
  exits: z.string().optional(),
  status: z.string().optional(),
  evidence: z.string().optional(),
});

export const SceneSpecificationSchema = z.object({
  id: z.number(),
  summary: z.string(),
  time: z.string(),
  place: z.string(),
  pov: z.string(),
  characters: z.record(z.string(), SceneCharacterSchema),
  goal: z.string(),
  obstacle: z.string(),
  outcome: z.string(),
  beats: z.array(z.string()),
  shift: z.string().describe('Emotional/value shift through scene'),
  leads_to: z.string(),
  image_prompt: z.string().describe('Visual description for scene visualization'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type Story = z.infer<typeof StorySchema>;
export type PartSpecification = z.infer<typeof PartSpecificationSchema>;
export type ChapterSpecification = z.infer<typeof ChapterSpecificationSchema>;
export type SceneSpecification = z.infer<typeof SceneSpecificationSchema>;
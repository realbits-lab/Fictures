/**
 * Zod Schemas for Novel Generation
 *
 * These schemas define the structured output format for each generation phase.
 * Used with Gemini's structured output feature to guarantee valid JSON responses.
 */

import { z } from 'zod';

/**
 * Story Summary Schema
 * Phase 1: Story foundation with title, genre, summary, tone, and moral framework
 */
export const StorySummarySchema = z.object({
  title: z.string().describe('Engaging and memorable story title'),
  genre: z.string().describe('Specific genre classification (e.g., Science Fiction, Mystery, Romance)'),
  summary: z.string().describe('2-3 sentences describing the thematic premise and moral framework'),
  tone: z.enum(['hopeful', 'dark', 'bittersweet', 'satirical']).describe('Overall emotional tone of the story'),
  moralFramework: z.string().describe('What virtues are valued in this story?'),
});

/**
 * Character Generation Schema
 * Phase 2: Complete character profile with personality, traits, and relationships
 */
export const CharacterSchema = z.object({
  id: z.string().describe('Unique character identifier'),
  name: z.string().describe('Character full name'),
  isMain: z.boolean().describe('Is this a main character?'),
  summary: z.string().describe('1-2 sentence character essence'),
  coreTrait: z.enum(['courage', 'compassion', 'integrity', 'loyalty', 'wisdom', 'sacrifice']).describe('Defining moral virtue'),
  internalFlaw: z.string().describe('Character flaw with cause (format: "[fears/believes/wounded by] X because Y")'),
  externalGoal: z.string().describe('What they think will solve their problem'),
  personality: z.object({
    traits: z.array(z.string()).describe('Behavioral traits (e.g., impulsive, optimistic)'),
    values: z.array(z.string()).describe('What they care about (e.g., family, honor)'),
  }),
  backstory: z.string().describe('Focused history providing motivation context (2-4 paragraphs)'),
  relationships: z.record(z.string(), z.object({
    type: z.enum(['ally', 'rival', 'family', 'romantic', 'mentor', 'adversary']),
    jeongLevel: z.number().min(0).max(10).describe('Depth of connection (0-10)'),
    sharedHistory: z.string().describe('What binds them'),
    currentDynamic: z.string().describe('Current relationship state'),
  })).optional().describe('Relationships with other characters (keyed by character ID)'),
  physicalDescription: z.object({
    age: z.string().describe('Age description (e.g., "mid-30s", "elderly")'),
    appearance: z.string().describe('Overall look'),
    distinctiveFeatures: z.string().describe('Memorable details for "show don\'t tell"'),
    style: z.string().describe('How they dress/present themselves'),
  }),
  voiceStyle: z.object({
    tone: z.string().describe('Speaking tone (e.g., "warm", "sarcastic", "formal")'),
    vocabulary: z.string().describe('Word choice level (e.g., "simple", "educated", "technical")'),
    quirks: z.array(z.string()).describe('Verbal tics, repeated phrases'),
    emotionalRange: z.string().describe('Emotional expressiveness (e.g., "reserved", "expressive")'),
  }),
  visualStyle: z.string().optional().describe('Visual art style for character portrait'),
});

/**
 * Setting Generation Schema
 * Phase 3: Immersive environment with sensory details and emotional atmosphere
 */
export const SettingSchema = z.object({
  id: z.string().describe('Unique setting identifier'),
  name: z.string().describe('Setting name'),
  description: z.string().describe('Comprehensive description (3-5 sentences)'),
  adversityElements: z.object({
    physicalObstacles: z.array(z.string()).describe('Environmental challenges'),
    scarcityFactors: z.array(z.string()).describe('Limited resources that force choices'),
    dangerSources: z.array(z.string()).describe('Threats from environment'),
    socialDynamics: z.array(z.string()).describe('Community factors'),
  }),
  symbolicMeaning: z.string().describe('How setting reflects story\'s moral framework'),
  cycleAmplification: z.object({
    setup: z.string().describe('How setting establishes adversity'),
    confrontation: z.string().describe('How setting intensifies conflict'),
    virtue: z.string().describe('How setting contrasts/witnesses moral beauty'),
    consequence: z.string().describe('How setting transforms or reveals'),
    transition: z.string().describe('How setting hints at new problems'),
  }),
  mood: z.string().describe('Primary emotional quality'),
  emotionalResonance: z.string().describe('What emotion this amplifies'),
  sensory: z.object({
    sight: z.array(z.string()).describe('Visual details (5-10 items)'),
    sound: z.array(z.string()).describe('Auditory elements (3-7 items)'),
    smell: z.array(z.string()).describe('Olfactory details (2-5 items)'),
    touch: z.array(z.string()).describe('Tactile sensations (2-5 items)'),
    taste: z.array(z.string()).optional().describe('Flavor elements (0-2 items)'),
  }),
  architecturalStyle: z.string().optional().describe('Structural design language'),
  visualStyle: z.string().describe('Visual art style for setting image'),
  visualReferences: z.array(z.string()).describe('Style inspirations (e.g., ["Blade Runner 2049"])'),
  colorPalette: z.array(z.string()).describe('Dominant colors (e.g., ["warm golds", "dusty browns"])'),
});

/**
 * Part Generation Schema
 * Phase 4: Act structure with macro character arcs
 */
export const PartSchema = z.object({
  id: z.string().describe('Unique part identifier'),
  title: z.string().describe('Part/Act title'),
  summary: z.string().describe('MACRO adversity-triumph arcs with progression planning'),
  orderIndex: z.number().describe('Part ordering (0-based)'),
  characterArcs: z.array(z.object({
    characterId: z.string().describe('References Character.id'),
    macroAdversity: z.object({
      internal: z.string().describe('From Character.internalFlaw'),
      external: z.string().describe('External obstacle forcing internal confrontation'),
    }),
    macroVirtue: z.string().describe('From Character.coreTrait - THE defining moral choice'),
    macroConsequence: z.string().describe('Earned payoff for virtue'),
    macroNewAdversity: z.string().describe('How resolution creates next act\'s challenge'),
    estimatedChapters: z.number().describe('Number of chapters for this arc (2-4 typical)'),
    arcPosition: z.enum(['primary', 'secondary']).describe('Primary arcs get more chapters'),
    progressionStrategy: z.string().describe('How this unfolds gradually'),
  })),
});

/**
 * Chapter Generation Schema
 * Phase 5: Single adversity-triumph cycle (micro-cycle)
 */
export const ChapterSchema = z.object({
  id: z.string().describe('Unique chapter identifier'),
  partId: z.string().describe('References Part.id'),
  title: z.string().describe('Chapter title'),
  summary: z.string().describe('One micro-cycle adversity-triumph description'),
  characterId: z.string().describe('Character whose macro arc this advances'),
  arcPosition: z.enum(['beginning', 'middle', 'climax', 'resolution']).describe('Position in macro arc'),
  contributesToMacroArc: z.string().describe('How this advances the macro transformation'),
  focusCharacters: z.array(z.string()).describe('Character IDs appearing in this chapter'),
  adversityType: z.enum(['internal', 'external', 'both']).describe('Type of adversity'),
  virtueType: z.enum(['courage', 'compassion', 'integrity', 'sacrifice', 'loyalty', 'wisdom']).describe('Virtue demonstrated'),
  seedsPlanted: z.array(z.object({
    id: z.string(),
    description: z.string(),
    expectedPayoff: z.string(),
  })).optional().describe('Seeds for future payoff'),
  seedsResolved: z.array(z.object({
    sourceChapterId: z.string(),
    sourceSceneId: z.string(),
    seedId: z.string(),
    payoffDescription: z.string(),
  })).optional().describe('Seeds resolved in this chapter'),
  connectsToPreviousChapter: z.string().describe('How previous resolution created this adversity'),
  createsNextAdversity: z.string().describe('How this resolution creates next problem'),
  orderIndex: z.number().describe('Chapter ordering within part'),
});

/**
 * Scene Summary Schema
 * Phase 6: Scene specification with planning metadata
 */
export const SceneSummarySchema = z.object({
  id: z.string().describe('Unique scene identifier'),
  chapterId: z.string().describe('References Chapter.id'),
  title: z.string().describe('Scene title'),
  summary: z.string().describe('Scene specification: what happens, emotional beat, purpose'),
  cyclePhase: z.enum(['setup', 'confrontation', 'virtue', 'consequence', 'transition']).describe('Adversity-triumph cycle phase'),
  emotionalBeat: z.enum(['fear', 'hope', 'tension', 'relief', 'elevation', 'catharsis', 'despair', 'joy']).describe('Primary emotion'),
  characterFocus: z.array(z.string()).describe('Character IDs appearing in this scene'),
  settingId: z.string().optional().describe('Setting ID where this scene takes place'),
  sensoryAnchors: z.array(z.string()).describe('Key sensory details to include'),
  dialogueVsDescription: z.string().describe('Balance guidance (e.g., "60% dialogue, 40% description")'),
  suggestedLength: z.enum(['short', 'medium', 'long']).describe('Scene length (short: 300-500, medium: 500-800, long: 800-1000 words)'),
  orderIndex: z.number().describe('Scene ordering within chapter'),
});

export type StorySummary = z.infer<typeof StorySummarySchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type Setting = z.infer<typeof SettingSchema>;
export type Part = z.infer<typeof PartSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type SceneSummary = z.infer<typeof SceneSummarySchema>;

// Type definitions for Adversity-Triumph Engine

export type VirtueType = 'courage' | 'compassion' | 'integrity' | 'loyalty' | 'wisdom' | 'sacrifice';
export type CyclePhase = 'setup' | 'confrontation' | 'virtue' | 'consequence' | 'transition';
export type ArcPosition = 'beginning' | 'middle' | 'climax' | 'resolution';
export type EmotionalBeat = 'fear' | 'hope' | 'tension' | 'relief' | 'elevation' | 'catharsis' | 'despair' | 'joy';

export interface Seed {
  id: string;
  description: string;
  expectedPayoff: string;
}

export interface SeedResolution {
  sourceChapterId: string;
  sourceSceneId: string;
  seedId: string;
  payoffDescription: string;
}

export interface CharacterRelationship {
  type: 'ally' | 'rival' | 'family' | 'romantic' | 'mentor' | 'adversary';
  jeongLevel: number; // 0-10
  sharedHistory: string;
  currentDynamic: string;
}

export interface CharacterMacroArc {
  characterId: string;
  macroAdversity: {
    internal: string;
    external: string;
  };
  macroVirtue: string;
  macroConsequence: string;
  macroNewAdversity: string;
  estimatedChapters: number;
  arcPosition: 'primary' | 'secondary';
  progressionStrategy: string;
}

export interface StoryGenerationContext {
  userPrompt: string;
  preferredGenre?: string;
  preferredTone?: 'dark' | 'hopeful' | 'bittersweet' | 'satirical';
  characterCount?: number;
}

export interface StorySummaryResult {
  summary: string;
  genre: string;
  tone: string;
  moralFramework: string;
  characters: {
    name: string;
    coreTrait: string;
    internalFlaw: string;
    externalGoal: string;
  }[];
}

export interface CharacterGenerationResult {
  id: string;
  name: string;
  isMain: boolean;
  summary: string;
  coreTrait: string;
  internalFlaw: string;
  externalGoal: string;
  personality: {
    traits: string[];
    values: string[];
  };
  backstory: string;
  relationships: Record<string, CharacterRelationship>;
  physicalDescription: {
    age: string;
    appearance: string;
    distinctiveFeatures: string;
    style: string;
  };
  voiceStyle: {
    tone: string;
    vocabulary: string;
    quirks: string[];
    emotionalRange: string;
  };
  visualStyle?: string;
}

export interface SettingGenerationResult {
  id: string;
  name: string;
  description: string;
  adversityElements: {
    physicalObstacles: string[];
    scarcityFactors: string[];
    dangerSources: string[];
    socialDynamics: string[];
  };
  symbolicMeaning: string;
  cycleAmplification: {
    setup: string;
    confrontation: string;
    virtue: string;
    consequence: string;
    transition: string;
  };
  mood: string;
  emotionalResonance: string;
  sensory: {
    sight: string[];
    sound: string[];
    smell: string[];
    touch: string[];
    taste: string[];
  };
  architecturalStyle?: string;
  visualStyle: string;
  visualReferences: string[];
  colorPalette: string[];
}

export interface PartGenerationResult {
  actNumber: number;
  title: string;
  summary: string;
  characterArcs: CharacterMacroArc[];
}

export interface ChapterGenerationResult {
  title: string;
  summary: string;
  characterId: string;
  arcPosition: ArcPosition;
  contributesToMacroArc: string;
  focusCharacters: string[];
  adversityType: string;
  virtueType: VirtueType;
  seedsPlanted: Seed[];
  seedsResolved: SeedResolution[];
  connectsToPreviousChapter: string;
  createsNextAdversity: string;
}

export interface SceneSummaryResult {
  title: string;
  summary: string;
  cyclePhase: CyclePhase;
  emotionalBeat: EmotionalBeat;
  characterFocus: string[];
  sensoryAnchors: string[];
  dialogueVsDescription: 'dialogue-heavy' | 'balanced' | 'description-heavy';
  suggestedLength: 'short' | 'medium' | 'long';
}

export interface SceneContentResult {
  content: string;
  wordCount: number;
  emotionalTone: string;
}

export interface SceneEvaluationScore {
  plot: number;
  character: number;
  pacing: number;
  prose: number;
  worldBuilding: number;
}

export interface SceneEvaluationFeedback {
  strengths: string[];
  improvements: string[];
  priorityFixes: string[];
}

export interface SceneEvaluationResult {
  iteration: number;
  scores: SceneEvaluationScore;
  overallScore: number;
  feedback: SceneEvaluationFeedback;
}

export interface ImageVariant {
  format: 'avif' | 'jpeg';
  device: 'mobile';
  resolution: '1x' | '2x';
  width: number;
  height: number;
  url: string;
  size: number;
}

export interface ImageVariantSet {
  imageId: string;
  originalUrl: string;
  variants: ImageVariant[];
  generatedAt: string;
}

/**
 * HNS (Hook-Nurture-Satisfy) Type Definitions
 *
 * These types bridge the gap between the old HNS methodology and the current
 * Adversity-Triumph Engine schema for backward compatibility with comic panel generation.
 */

// ============================================
// SCENE TYPES
// ============================================

export interface HNSScene {
  // Database schema fields (Adversity-Triumph Engine)
  id: string;
  title: string;
  content: string;
  chapterId: string;
  orderIndex: number;
  imageUrl: string | null;
  imageVariants: Record<string, unknown> | null;
  summary: string | null;

  // Adversity-Triumph Engine specific fields
  cyclePhase: 'setup' | 'confrontation' | 'virtue' | 'consequence' | 'transition' | null;
  emotionalBeat: 'fear' | 'hope' | 'tension' | 'relief' | 'elevation' | 'catharsis' | 'despair' | 'joy' | null;
  characterFocus: string[] | null; // Array of character IDs
  sensoryAnchors: string[] | null; // Key sensory details
  dialogueVsDescription: string | null; // "dialogue-heavy" | "balanced" | "description-heavy"
  suggestedLength: string | null; // "short" | "medium" | "long"

  // Publishing fields
  publishedAt: Date | null;
  scheduledFor: Date | null;
  visibility: 'private' | 'unlisted' | 'public';

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Legacy HNS fields (for backward compatibility - derived from new schema)
  scene_id?: string; // Alias for id
  scene_title?: string; // Alias for title
  character_ids?: string[]; // Alias for characterFocus
  setting_id?: string; // No longer exists - will be null

  // Derived fields for screenplay conversion
  goal?: string; // Derived from summary
  conflict?: string; // Derived from cyclePhase and emotionalBeat
  outcome?: string; // Derived from content
  emotional_shift?: {
    from: string;
    to: string;
  }; // Derived from emotionalBeat
}

// ============================================
// CHARACTER TYPES
// ============================================

export interface HNSCharacter {
  // Database schema fields (Adversity-Triumph Engine)
  id: string;
  name: string;
  storyId: string;
  isMain: boolean;
  content: string;
  imageUrl: string | null;
  imageVariants: Record<string, unknown> | null;

  // Character details
  role: string | null;
  archetype: string | null;
  summary: string | null;
  storyline: string | null;

  // Personality and motivations
  personality: {
    traits: string[];
    myers_briggs: string;
    enneagram: string;
  } | null;
  backstory: Record<string, string> | null;
  motivations: {
    primary: string;
    secondary: string;
    fear: string;
  } | null;
  voice: Record<string, unknown> | null;
  physicalDescription: Record<string, unknown> | null;
  visualReferenceId: string | null;

  // Adversity-Triumph Engine specific fields
  coreTrait: string | null;
  internalFlaw: string | null;
  externalGoal: string | null;
  relationships: Record<string, {
    type: 'ally' | 'rival' | 'family' | 'romantic' | 'mentor' | 'adversary';
    jeongLevel: number;
    sharedHistory: string;
    currentDynamic: string;
  }> | null;
  voiceStyle: {
    tone: string;
    vocabulary: string;
    quirks: string[];
    emotionalRange: string;
  } | null;
  visualStyle: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Legacy HNS fields (for backward compatibility)
  character_id?: string; // Alias for id
}

// ============================================
// SETTING TYPES
// ============================================

export interface HNSSetting {
  // Database schema fields (Adversity-Triumph Engine)
  id: string;
  name: string;
  storyId: string;
  description: string | null;
  mood: string | null;
  sensory: Record<string, string[]> | null;
  visualStyle: string | null;
  visualReferences: string[] | null;
  colorPalette: string[] | null;
  architecturalStyle: string | null;
  imageUrl: string | null;
  imageVariants: Record<string, unknown> | null;

  // Adversity-Triumph Engine specific fields
  adversityElements: {
    physicalObstacles: string[];
    scarcityFactors: string[];
    dangerSources: string[];
    socialDynamics: string[];
  } | null;
  symbolicMeaning: string | null;
  cycleAmplification: {
    setup: string;
    confrontation: string;
    virtue: string;
    consequence: string;
    transition: string;
  } | null;
  emotionalResonance: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Legacy HNS fields (for backward compatibility)
  setting_id?: string; // Alias for id
  atmosphere?: string; // Alias for mood
  setting_type?: string; // No longer exists
  time_of_day?: string; // No longer exists
  weather?: string; // No longer exists
}

// ============================================
// STORY TYPE (for context)
// ============================================

export interface HNSStory {
  id: string;
  title: string;
  genre: string | null;
  status: 'writing' | 'published';
  authorId: string;
  summary: string | null;
  tone: 'hopeful' | 'dark' | 'bittersweet' | 'satirical' | null;
  moralFramework: string | null;
  imageUrl: string | null;
  imageVariants: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;

  // Legacy HNS fields
  story_id?: string; // Alias for id
}

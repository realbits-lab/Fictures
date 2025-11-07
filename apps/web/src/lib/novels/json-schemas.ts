/**
 * JSON Schemas for Gemini Structured Output
 *
 * Manually defined JSON schemas that match the Zod schemas in schemas.ts
 * These are used directly with Gemini's structured output feature.
 */

export const StorySummaryJsonSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Engaging and memorable story title',
    },
    genre: {
      type: 'string',
      description: 'Specific genre classification (e.g., Science Fiction, Mystery, Romance)',
    },
    summary: {
      type: 'string',
      description: '2-3 sentences describing the thematic premise and moral framework',
    },
    tone: {
      type: 'string',
      enum: ['hopeful', 'dark', 'bittersweet', 'satirical'],
      description: 'Overall emotional tone of the story',
    },
    moralFramework: {
      type: 'string',
      description: 'What virtues are valued in this story?',
    },
  },
  required: ['title', 'genre', 'summary', 'tone', 'moralFramework'],
};

export const CharacterJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    isMain: { type: 'boolean' },
    summary: { type: 'string' },
    coreTrait: {
      type: 'string',
      enum: ['courage', 'compassion', 'integrity', 'loyalty', 'wisdom', 'sacrifice'],
    },
    internalFlaw: { type: 'string' },
    externalGoal: { type: 'string' },
    personality: {
      type: 'object',
      properties: {
        traits: { type: 'array', items: { type: 'string' } },
        values: { type: 'array', items: { type: 'string' } },
      },
      required: ['traits', 'values'],
    },
    backstory: { type: 'string' },
    physicalDescription: {
      type: 'object',
      properties: {
        age: { type: 'string' },
        appearance: { type: 'string' },
        distinctiveFeatures: { type: 'string' },
        style: { type: 'string' },
      },
      required: ['age', 'appearance', 'distinctiveFeatures', 'style'],
    },
    voiceStyle: {
      type: 'object',
      properties: {
        tone: { type: 'string' },
        vocabulary: { type: 'string' },
        quirks: { type: 'array', items: { type: 'string' } },
        emotionalRange: { type: 'string' },
      },
      required: ['tone', 'vocabulary', 'quirks', 'emotionalRange'],
    },
    visualStyle: { type: 'string' },
  },
  required: ['id', 'name', 'isMain', 'summary', 'coreTrait', 'internalFlaw', 'externalGoal', 'personality', 'backstory', 'physicalDescription', 'voiceStyle'],
  description: 'Character profile with personality, traits, and background',
};

export const SettingJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    adversityElements: {
      type: 'object',
      properties: {
        physicalObstacles: { type: 'array', items: { type: 'string' } },
        scarcityFactors: { type: 'array', items: { type: 'string' } },
        dangerSources: { type: 'array', items: { type: 'string' } },
        socialDynamics: { type: 'array', items: { type: 'string' } },
      },
      required: ['physicalObstacles', 'scarcityFactors', 'dangerSources', 'socialDynamics'],
    },
    symbolicMeaning: { type: 'string' },
    cycleAmplification: {
      type: 'object',
      properties: {
        setup: { type: 'string' },
        confrontation: { type: 'string' },
        virtue: { type: 'string' },
        consequence: { type: 'string' },
        transition: { type: 'string' },
      },
      required: ['setup', 'confrontation', 'virtue', 'consequence', 'transition'],
    },
    mood: { type: 'string' },
    emotionalResonance: { type: 'string' },
    sensory: {
      type: 'object',
      properties: {
        sight: { type: 'array', items: { type: 'string' } },
        sound: { type: 'array', items: { type: 'string' } },
        smell: { type: 'array', items: { type: 'string' } },
        touch: { type: 'array', items: { type: 'string' } },
        taste: { type: 'array', items: { type: 'string' } },
      },
      required: ['sight', 'sound', 'smell', 'touch'],
    },
    architecturalStyle: { type: 'string' },
    visualStyle: { type: 'string' },
    visualReferences: { type: 'array', items: { type: 'string' } },
    colorPalette: { type: 'array', items: { type: 'string' } },
  },
  required: ['id', 'name', 'description', 'adversityElements', 'symbolicMeaning', 'cycleAmplification', 'mood', 'emotionalResonance', 'sensory', 'visualStyle', 'visualReferences', 'colorPalette'],
};

export const PartJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    summary: { type: 'string' },
    orderIndex: { type: 'number' },
    characterArcs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          characterId: { type: 'string' },
          macroAdversity: {
            type: 'object',
            properties: {
              internal: { type: 'string' },
              external: { type: 'string' },
            },
            required: ['internal', 'external'],
          },
          macroVirtue: { type: 'string' },
          macroConsequence: { type: 'string' },
          macroNewAdversity: { type: 'string' },
          estimatedChapters: { type: 'number' },
          arcPosition: {
            type: 'string',
            enum: ['primary', 'secondary'],
          },
          progressionStrategy: { type: 'string' },
        },
        required: ['characterId', 'macroAdversity', 'macroVirtue', 'macroConsequence', 'macroNewAdversity', 'estimatedChapters', 'arcPosition', 'progressionStrategy'],
      },
    },
  },
  required: ['id', 'title', 'summary', 'orderIndex', 'characterArcs'],
};

export const ChapterJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    partId: { type: 'string' },
    title: { type: 'string' },
    summary: { type: 'string' },
    characterId: { type: 'string' },
    arcPosition: {
      type: 'string',
      enum: ['beginning', 'middle', 'climax', 'resolution'],
    },
    contributesToMacroArc: { type: 'string' },
    focusCharacters: { type: 'array', items: { type: 'string' } },
    adversityType: {
      type: 'string',
      enum: ['internal', 'external', 'both'],
    },
    virtueType: {
      type: 'string',
      enum: ['courage', 'compassion', 'integrity', 'sacrifice', 'loyalty', 'wisdom'],
    },
    seedsPlanted: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          description: { type: 'string' },
          expectedPayoff: { type: 'string' },
        },
      },
    },
    seedsResolved: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sourceChapterId: { type: 'string' },
          sourceSceneId: { type: 'string' },
          seedId: { type: 'string' },
          payoffDescription: { type: 'string' },
        },
      },
    },
    connectsToPreviousChapter: { type: 'string' },
    createsNextAdversity: { type: 'string' },
    orderIndex: { type: 'number' },
  },
  required: ['id', 'partId', 'title', 'summary', 'characterId', 'arcPosition', 'contributesToMacroArc', 'focusCharacters', 'adversityType', 'virtueType', 'connectsToPreviousChapter', 'createsNextAdversity', 'orderIndex'],
};

export const SceneSummaryJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    chapterId: { type: 'string' },
    title: { type: 'string' },
    summary: { type: 'string' },
    cyclePhase: {
      type: 'string',
      enum: ['setup', 'confrontation', 'virtue', 'consequence', 'transition'],
    },
    emotionalBeat: {
      type: 'string',
      enum: ['fear', 'hope', 'tension', 'relief', 'elevation', 'catharsis', 'despair', 'joy'],
    },
    characterFocus: { type: 'array', items: { type: 'string' } },
    settingId: { type: 'string' },
    sensoryAnchors: { type: 'array', items: { type: 'string' } },
    dialogueVsDescription: { type: 'string' },
    suggestedLength: {
      type: 'string',
      enum: ['short', 'medium', 'long'],
    },
    orderIndex: { type: 'number' },
  },
  required: ['id', 'chapterId', 'title', 'summary', 'cyclePhase', 'emotionalBeat', 'characterFocus', 'sensoryAnchors', 'dialogueVsDescription', 'suggestedLength', 'orderIndex'],
};

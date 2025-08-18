import { generateObject, tool } from 'ai';
import { z } from 'zod';
import { HierarchicalContextManager } from '@/lib/ai/context/hierarchy-context-manager';
import { 
  createScene, 
  updateScene, 
  createChapter, 
  createPart, 
  createStory 
} from '@/lib/db/queries/hierarchy';

// Initialize context manager
const contextManager = new HierarchicalContextManager();

// Schema definitions for AI tool inputs and outputs
const SceneGenerationSchema = z.object({
  title: z.string(),
  content: z.string(),
  sceneType: z.enum(['action', 'dialogue', 'exposition', 'transition', 'climax']),
  purpose: z.string(),
  conflict: z.string().optional(),
  mood: z.enum(['tense', 'romantic', 'mysterious', 'comedic', 'dramatic', 'neutral']).optional(),
  charactersPresent: z.array(z.string()).optional(),
  location: z.string().optional(),
  timeOfDay: z.string().optional(),
  resolution: z.string().optional()
});

const ChapterOutlineSchema = z.object({
  chapterNumber: z.number(),
  title: z.string(),
  summary: z.string(),
  scenes: z.array(z.object({
    title: z.string(),
    sceneType: z.enum(['action', 'dialogue', 'exposition', 'transition', 'climax']),
    purpose: z.string()
  })).optional(),
  wordCountTarget: z.number(),
  pov: z.string().optional(),
  setting: z.string().optional()
});

const PartExpansionSchema = z.object({
  chapters: z.array(ChapterOutlineSchema),
  totalWordCount: z.number(),
  thematicProgression: z.string()
});

const StoryStructureSchema = z.object({
  title: z.string(),
  synopsis: z.string(),
  storyStructure: z.object({
    setup: z.string(),
    incitingIncident: z.string(),
    risingAction: z.string(),
    climax: z.string(),
    resolution: z.string()
  }),
  characters: z.array(z.object({
    name: z.string(),
    role: z.string(),
    background: z.string(),
    arc: z.string()
  })),
  worldBuilding: z.object({
    setting: z.string(),
    magicSystem: z.string().optional(),
    cultures: z.array(z.string())
  }),
  partBreakdown: z.array(z.object({
    partNumber: z.number(),
    title: z.string(),
    description: z.string(),
    chapterCount: z.number()
  }))
});

const CharacterConsistencySchema = z.object({
  characterName: z.string(),
  consistencyScore: z.number(),
  issues: z.array(z.object({
    type: z.string(),
    description: z.string(),
    scenes: z.array(z.string()),
    suggestion: z.string()
  })),
  recommendations: z.array(z.string()),
  improvedScenes: z.array(z.object({
    sceneId: z.string(),
    improvements: z.object({
      dialogue: z.string().optional(),
      characterActions: z.string().optional(),
      consistency: z.string().optional()
    })
  }))
});

const ChapterSummarySchema = z.object({
  chapterId: z.string(),
  title: z.string(),
  summary: z.string(),
  sceneBreakdown: z.array(z.object({
    sceneNumber: z.number(),
    title: z.string(),
    summary: z.string(),
    purpose: z.string(),
    keyEvents: z.array(z.string())
  })).optional(),
  characterArcs: z.array(z.object({
    character: z.string(),
    arcProgression: z.string(),
    keyMoments: z.array(z.string())
  })).optional(),
  thematicElements: z.array(z.string()).optional(),
  wordCount: z.number(),
  progression: z.object({
    plotAdvancement: z.string(),
    characterDevelopment: z.string(),
    worldBuilding: z.string()
  }).optional()
});

// Type definitions for function parameters
export interface SceneGenerationParams {
  chapterId: string;
  sceneType: 'action' | 'dialogue' | 'exposition' | 'transition' | 'climax';
  prompt: string;
  includeContext?: boolean;
  previousSceneCount?: number;
  characterFocus?: string[];
  mood?: 'tense' | 'romantic' | 'mysterious' | 'comedic' | 'dramatic' | 'neutral';
  location?: string;
}

export interface PartExpansionParams {
  partId: string;
  chapterCount: number;
  targetWordCount?: number;
  thematicFocus?: string;
  includeSceneBreakdown?: boolean;
  scenesPerChapter?: number;
}

export interface StoryStructureParams {
  bookId: string;
  premise: string;
  genre: string;
  targetLength?: 'novella' | 'novel' | 'epic';
  themes?: string[];
  characterCount?: number;
}

export interface CharacterConsistencyParams {
  bookId: string;
  characterName: string;
  sceneIds: string[];
  focusAreas?: string[];
}

export interface ChapterSummaryParams {
  chapterId: string;
  includeSceneBreakdown?: boolean;
  includeCharacterArcs?: boolean;
  includeThematicElements?: boolean;
  summaryStyle?: 'brief' | 'standard' | 'detailed';
}

/**
 * Create a new scene with full story context
 */
export async function createSceneWithContext(params: SceneGenerationParams) {
  const {
    chapterId,
    sceneType,
    prompt,
    includeContext = true,
    previousSceneCount = 3,
    characterFocus = [],
    mood,
    location
  } = params;

  // Validate required parameters
  if (!chapterId || !sceneType || !prompt) {
    throw new Error('Missing required parameters: chapterId, sceneType, and prompt are required');
  }

  let contextPrompt = '';
  
  if (includeContext) {
    // Get some scene from the chapter for context (use the first scene as approximation)
    try {
      const context = await contextManager.getContext(chapterId); // This will use a scene from the chapter
      contextPrompt = await contextManager.generatePrompt(chapterId, {
        includeCharacterProfiles: true,
        includeWorldSettings: true,
        previousSceneCount
      });
    } catch (error) {
      console.warn('Failed to get context, proceeding without full context:', error);
    }
  }

  // Build the AI prompt
  let aiPrompt = `Create a ${sceneType} scene with the following requirements:

${prompt}

Scene Type: ${sceneType}
${mood ? `Mood: ${mood}` : ''}
${location ? `Location: ${location}` : ''}
${characterFocus.length > 0 ? `Focus Characters: ${characterFocus.join(', ')}` : ''}

`;

  if (contextPrompt) {
    aiPrompt += `\nSTORY CONTEXT:\n${contextPrompt}\n`;
  }

  aiPrompt += `
Generate a scene that:
1. Fits naturally into the story progression
2. Maintains character consistency
3. Advances the plot or develops characters
4. Matches the specified scene type and mood
5. Includes appropriate dialogue, action, and description

Return the scene with title, content, and metadata.`;

  // Use AI to generate the scene
  const result = await generateObject({
    model: 'gpt-4', // This will be replaced with the actual model from the project
    prompt: aiPrompt,
    schema: SceneGenerationSchema
  });

  return result.object;
}

/**
 * Expand a part into detailed chapter outlines
 */
export async function expandPartToChapters(params: PartExpansionParams) {
  const {
    partId,
    chapterCount,
    targetWordCount = chapterCount * 5000,
    thematicFocus,
    includeSceneBreakdown = false,
    scenesPerChapter = 4
  } = params;

  // Get context for the part
  let contextPrompt = '';
  try {
    const context = await contextManager.getContext(partId);
    contextPrompt = await contextManager.generatePrompt(partId, {
      includeCharacterProfiles: true,
      includeWorldSettings: true,
      contextDepth: 'detailed'
    });
  } catch (error) {
    console.warn('Failed to get part context:', error);
  }

  const aiPrompt = `Expand this part into ${chapterCount} detailed chapter outlines.

Target total word count: ${targetWordCount}
${thematicFocus ? `Thematic focus: ${thematicFocus}` : ''}
${includeSceneBreakdown ? `Include scene breakdown with ${scenesPerChapter} scenes per chapter` : ''}

${contextPrompt ? `STORY CONTEXT:\n${contextPrompt}\n` : ''}

Create detailed chapter outlines that:
1. Distribute the total word count evenly across chapters
2. Progress the story logically from chapter to chapter
3. Maintain thematic consistency
4. Include scene breakdowns if requested
5. Specify POV, setting, and key plot points for each chapter

Return a structured breakdown with all chapters and their details.`;

  const result = await generateObject({
    model: 'gpt-4',
    prompt: aiPrompt,
    schema: PartExpansionSchema
  });

  return result.object;
}

/**
 * Generate complete story structure from premise
 */
export async function generateStoryStructure(params: StoryStructureParams) {
  const {
    bookId,
    premise,
    genre,
    targetLength = 'novel',
    themes = [],
    characterCount = 5
  } = params;

  const partCounts = {
    novella: 2,
    novel: 3,
    epic: 4
  };

  const chapterCounts = {
    novella: 8,
    novel: 10,
    epic: 12
  };

  const expectedParts = partCounts[targetLength];
  const chaptersPerPart = chapterCounts[targetLength];

  const aiPrompt = `Generate a complete ${targetLength} story structure based on this premise:

PREMISE: ${premise}
GENRE: ${genre}
TARGET LENGTH: ${targetLength}
${themes.length > 0 ? `THEMES: ${themes.join(', ')}` : ''}
CHARACTER COUNT: ${characterCount}

Create a comprehensive story structure that includes:
1. Title and engaging synopsis
2. Five-act story structure (setup, inciting incident, rising action, climax, resolution)
3. ${characterCount} well-developed characters with clear arcs
4. Rich world-building appropriate for ${genre}
5. ${expectedParts} parts with approximately ${chaptersPerPart} chapters each
6. Thematic integration of: ${themes.join(', ')}

The structure should be compelling, well-paced, and suitable for the ${genre} genre.`;

  const result = await generateObject({
    model: 'gpt-4',
    prompt: aiPrompt,
    schema: StoryStructureSchema
  });

  return result.object;
}

/**
 * Improve character consistency across scenes
 */
export async function improveCharacterConsistency(params: CharacterConsistencyParams) {
  const {
    bookId,
    characterName,
    sceneIds,
    focusAreas = ['personality', 'dialogue', 'motivations', 'relationships']
  } = params;

  // Get context for each scene
  const sceneContexts = [];
  for (const sceneId of sceneIds) {
    try {
      const context = await contextManager.getContext(sceneId);
      sceneContexts.push({
        sceneId,
        context
      });
    } catch (error) {
      console.warn(`Failed to get context for scene ${sceneId}:`, error);
    }
  }

  const aiPrompt = `Analyze character consistency for "${characterName}" across ${sceneIds.length} scenes.

FOCUS AREAS: ${focusAreas.join(', ')}

SCENES TO ANALYZE:
${sceneContexts.map((sc, i) => `
Scene ${i + 1} (${sc.sceneId}):
${sc.context ? JSON.stringify(sc.context.scene.current, null, 2) : 'Context unavailable'}
`).join('\n')}

Analyze the character's consistency across these scenes, focusing on:
- ${focusAreas.join('\n- ')}

Provide:
1. Overall consistency score (0-100)
2. Specific issues found with scene references
3. Actionable recommendations for improvement
4. Suggested improvements for individual scenes

Be thorough but constructive in your analysis.`;

  const result = await generateObject({
    model: 'gpt-4',
    prompt: aiPrompt,
    schema: CharacterConsistencySchema
  });

  return result.object;
}

/**
 * Generate comprehensive chapter summary for context
 */
export async function generateChapterSummary(params: ChapterSummaryParams) {
  const {
    chapterId,
    includeSceneBreakdown = false,
    includeCharacterArcs = false,
    includeThematicElements = false,
    summaryStyle = 'standard'
  } = params;

  // Get full context for the chapter
  let contextPrompt = '';
  try {
    const context = await contextManager.getContext(chapterId);
    contextPrompt = await contextManager.generatePrompt(chapterId, {
      includeCharacterProfiles: includeCharacterArcs,
      includeWorldSettings: true,
      contextDepth: summaryStyle === 'detailed' ? 'full' : 'standard'
    });
  } catch (error) {
    console.warn('Failed to get chapter context:', error);
  }

  const aiPrompt = `Generate a ${summaryStyle} chapter summary.

${contextPrompt ? `CHAPTER CONTEXT:\n${contextPrompt}\n` : ''}

Summary requirements:
- Style: ${summaryStyle}
${includeSceneBreakdown ? '- Include detailed scene-by-scene breakdown' : ''}
${includeCharacterArcs ? '- Include character arc progressions' : ''}
${includeThematicElements ? '- Include thematic elements and their development' : ''}

Create a comprehensive summary that captures:
1. Main plot events and their significance
2. Character development and interactions
3. Setting and atmosphere
4. Key themes and their expression
5. How this chapter advances the overall story

The summary should be ${summaryStyle === 'brief' ? 'concise and focused' : summaryStyle === 'detailed' ? 'comprehensive and analytical' : 'balanced and informative'}.`;

  const result = await generateObject({
    model: 'gpt-4',
    prompt: aiPrompt,
    schema: ChapterSummarySchema
  });

  return result.object;
}

/**
 * AI Tools for hierarchy integration with AI SDK
 */
export const hierarchyTools = {
  createScene: tool({
    description: 'Create a new scene with AI assistance using full story context. Generates contextually appropriate scenes that fit within the story hierarchy.',
    parameters: z.object({
      chapterId: z.string().describe('ID of the chapter to create the scene in'),
      sceneType: z.enum(['action', 'dialogue', 'exposition', 'transition', 'climax']).describe('Type of scene to create'),
      prompt: z.string().describe('Specific instructions for scene creation'),
      includeContext: z.boolean().default(true).describe('Whether to include full story context'),
      characterFocus: z.array(z.string()).optional().describe('Characters to focus on in the scene'),
      mood: z.enum(['tense', 'romantic', 'mysterious', 'comedic', 'dramatic', 'neutral']).optional().describe('Mood for the scene'),
      location: z.string().optional().describe('Location where the scene takes place')
    }),
    execute: async (params) => {
      return await createSceneWithContext(params);
    }
  }),

  expandPart: tool({
    description: 'Expand a story part into detailed chapter outlines with scene breakdowns. Uses story context to create coherent chapter progressions.',
    parameters: z.object({
      partId: z.string().describe('ID of the part to expand'),
      chapterCount: z.number().describe('Number of chapters to create'),
      targetWordCount: z.number().optional().describe('Target total word count for all chapters'),
      thematicFocus: z.string().optional().describe('Main thematic focus for this part'),
      includeSceneBreakdown: z.boolean().default(false).describe('Whether to include scene-by-scene breakdown'),
      scenesPerChapter: z.number().default(4).describe('Number of scenes per chapter when including breakdown')
    }),
    execute: async (params) => {
      return await expandPartToChapters(params);
    }
  }),

  generateStoryStructure: tool({
    description: 'Generate a complete story structure from a premise. Creates comprehensive story outlines with characters, world-building, and part breakdowns.',
    parameters: z.object({
      bookId: z.string().describe('ID of the book to generate structure for'),
      premise: z.string().describe('The story premise or concept'),
      genre: z.string().describe('Genre of the story'),
      targetLength: z.enum(['novella', 'novel', 'epic']).default('novel').describe('Target length of the story'),
      themes: z.array(z.string()).optional().describe('Major themes to incorporate'),
      characterCount: z.number().default(5).describe('Number of main characters to develop')
    }),
    execute: async (params) => {
      return await generateStoryStructure(params);
    }
  }),

  improveCharacterConsistency: tool({
    description: 'Analyze and improve character consistency across multiple scenes. Identifies inconsistencies and provides improvement suggestions.',
    parameters: z.object({
      bookId: z.string().describe('ID of the book'),
      characterName: z.string().describe('Name of the character to analyze'),
      sceneIds: z.array(z.string()).describe('Array of scene IDs to analyze'),
      focusAreas: z.array(z.string()).optional().describe('Specific areas to focus on (personality, dialogue, motivations, etc.)')
    }),
    execute: async (params) => {
      return await improveCharacterConsistency(params);
    }
  }),

  generateChapterSummary: tool({
    description: 'Generate comprehensive chapter summaries for AI context. Creates detailed summaries with optional scene breakdowns and character arc analysis.',
    parameters: z.object({
      chapterId: z.string().describe('ID of the chapter to summarize'),
      includeSceneBreakdown: z.boolean().default(false).describe('Whether to include scene-by-scene breakdown'),
      includeCharacterArcs: z.boolean().default(false).describe('Whether to include character arc progressions'),
      includeThematicElements: z.boolean().default(false).describe('Whether to include thematic elements'),
      summaryStyle: z.enum(['brief', 'standard', 'detailed']).default('standard').describe('Level of detail for the summary')
    }),
    execute: async (params) => {
      return await generateChapterSummary(params);
    }
  })
};
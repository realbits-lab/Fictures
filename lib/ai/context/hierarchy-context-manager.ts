import { buildHierarchyContext, type HierarchyContext } from '@/lib/db/queries/hierarchy';

// Extended types for AI integration
export interface HierarchicalContext extends HierarchyContext {
  scene: HierarchyContext['scene'] & {
    purpose?: string;
    conflicts?: string[];
  };
  chapter: HierarchyContext['chapter'] & {
    progression?: number;
  };
  part: HierarchyContext['part'] & {
    characterArcs?: CharacterArc[];
  };
  story: HierarchyContext['story'] & {
    characterProfiles?: Character[];
    plotStructure?: PlotStructure;
  };
  book: HierarchyContext['book'] & {
    wordCount?: number;
  };
}

export interface Character {
  name: string;
  age?: number;
  background?: string;
  personality?: string;
  goals?: string;
  relationships?: string[];
}

export interface CharacterArc {
  character: string;
  arc: string;
  currentState: string;
}

export interface PlotStructure {
  act1?: string;
  act2?: string;
  act3?: string;
}

export interface ContextOptions {
  includeCharacterProfiles?: boolean;
  includePlotStructure?: boolean;
  includeWorldSettings?: boolean;
  previousSceneCount?: number;
  nextSceneCount?: number;
  contextDepth?: 'minimal' | 'standard' | 'detailed' | 'full';
  maxContextSize?: number;
}

// In-memory cache for demonstration (in production, would use Redis)
const contextCache = new Map<string, { data: HierarchicalContext; expires: number }>();

/**
 * Build comprehensive context for AI operations at any hierarchy level
 */
export async function buildFullContext(
  sceneId: string, 
  options: ContextOptions = {}
): Promise<HierarchicalContext> {
  const {
    includeCharacterProfiles = true,
    includePlotStructure = true,
    includeWorldSettings = true,
    contextDepth = 'full'
  } = options;

  try {
    // Get base hierarchy context
    const baseContext = await buildHierarchyContext(sceneId);

    // Convert to HierarchicalContext with additional AI-specific data
    const hierarchicalContext: HierarchicalContext = {
      ...baseContext,
      scene: {
        ...baseContext.scene,
        purpose: baseContext.scene.current?.purpose || 'Advance the story',
        conflicts: baseContext.scene.current?.conflict ? [baseContext.scene.current.conflict] : []
      },
      chapter: {
        ...baseContext.chapter,
        progression: calculateChapterProgression(baseContext)
      },
      part: {
        ...baseContext.part,
        characterArcs: extractCharacterArcs(baseContext)
      },
      story: {
        ...baseContext.story,
        characterProfiles: includeCharacterProfiles ? extractCharacterProfiles(baseContext) : [],
        plotStructure: includePlotStructure ? extractPlotStructure(baseContext) : undefined
      },
      book: {
        ...baseContext.book,
        wordCount: baseContext.book.wordCount || 0
      }
    };

    // Apply context depth filtering
    return applyContextDepth(hierarchicalContext, contextDepth);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to build hierarchy context');
  }
}

/**
 * Generate AI-optimized context prompt from hierarchical context
 */
export function generateContextPrompt(
  context: HierarchicalContext,
  options: ContextOptions = {}
): string {
  const {
    includeCharacterProfiles = true,
    includePlotStructure = true,
    includeWorldSettings = true,
    contextDepth = 'full'
  } = options;

  let prompt = '';

  // Book context
  prompt += `BOOK CONTEXT:\n`;
  prompt += `Title: ${context.book.title}\n`;
  prompt += `Genre: ${context.book.genre}\n`;
  prompt += `Overall Progress: ${context.book.overallProgress}%\n`;
  prompt += `Word Count: ${context.book.wordCount || 0}\n\n`;

  // Story context
  prompt += `STORY CONTEXT:\n`;
  prompt += `Synopsis: ${context.story.synopsis}\n`;
  prompt += `Themes: ${context.story.themes.join(', ')}\n`;
  
  if (includeWorldSettings && context.story.worldSettings) {
    prompt += `\nWORLD SETTINGS:\n`;
    const world = context.story.worldSettings;
    if (world.time) prompt += `Time: ${world.time}\n`;
    if (world.location) prompt += `Location: ${world.location}\n`;
    if (world.magicSystem) prompt += `Magic System: ${world.magicSystem}\n`;
    if (world.cultures) prompt += `Cultures: ${world.cultures.join(', ')}\n`;
  }

  if (includeCharacterProfiles && context.story.characterProfiles?.length) {
    prompt += `\nCHARACTER PROFILES:\n`;
    context.story.characterProfiles.forEach(char => {
      prompt += `- ${char.name}:\n`;
      if (char.age) prompt += `  Age: ${char.age}\n`;
      if (char.background) prompt += `  Background: ${char.background}\n`;
      if (char.personality) prompt += `  Personality: ${char.personality}\n`;
      if (char.goals) prompt += `  Goals: ${char.goals}\n`;
      if (char.relationships?.length) prompt += `  Relationships: ${char.relationships.join(', ')}\n`;
    });
  }

  if (includePlotStructure && context.story.plotStructure) {
    prompt += `\nPLOT STRUCTURE:\n`;
    const plot = context.story.plotStructure;
    if (plot.act1) prompt += `Act 1: ${plot.act1}\n`;
    if (plot.act2) prompt += `Act 2: ${plot.act2}\n`;
    if (plot.act3) prompt += `Act 3: ${plot.act3}\n`;
  }

  prompt += `\n`;

  // Part context
  prompt += `PART CONTEXT:\n`;
  prompt += `Description: ${context.part.description}\n`;
  prompt += `Thematic Focus: ${context.part.thematicFocus}\n`;
  if (context.part.chapterSummaries?.length) {
    prompt += `Chapter Summaries:\n`;
    context.part.chapterSummaries.forEach((summary, i) => {
      if (summary) prompt += `  ${i + 1}. ${summary}\n`;
    });
  }
  prompt += `\n`;

  // Chapter context
  prompt += `CHAPTER CONTEXT:\n`;
  prompt += `Summary: ${context.chapter.summary}\n`;
  prompt += `POV: ${context.chapter.pov}\n`;
  prompt += `Setting: ${context.chapter.setting}\n`;
  prompt += `Progression: ${context.chapter.progression || 0}%\n\n`;

  // Scene context
  prompt += `SCENE CONTEXT:\n`;
  prompt += `Current Scene: ${context.scene.current?.title || 'Untitled Scene'}\n`;
  prompt += `Content: ${context.scene.current?.content?.substring(0, 200) || ''}...\n`;
  prompt += `Type: ${context.scene.current?.sceneType || 'unknown'}\n`;
  prompt += `POV: ${context.scene.current?.pov || 'unknown'}\n`;
  prompt += `Location: ${context.scene.current?.location || 'unknown'}\n`;
  prompt += `Characters Present: ${context.scene.current?.charactersPresent?.join(', ') || 'unknown'}\n`;
  prompt += `Mood: ${context.scene.current?.mood || 'neutral'}\n`;
  if (context.scene.purpose) prompt += `Purpose: ${context.scene.purpose}\n`;
  if (context.scene.conflicts?.length) prompt += `Conflicts: ${context.scene.conflicts.join(', ')}\n`;
  prompt += `\n`;

  // Previous scenes
  if (context.scene.previous?.length) {
    prompt += `PREVIOUS SCENES:\n`;
    context.scene.previous.forEach((scene, i) => {
      prompt += `${i + 1}. ${scene.title || 'Untitled'} (${scene.sceneType || 'unknown'})\n`;
      if (scene.purpose) prompt += `   Purpose: ${scene.purpose}\n`;
    });
    prompt += `\n`;
  }

  // Next scenes
  if (context.scene.next?.length) {
    prompt += `NEXT SCENES:\n`;
    context.scene.next.forEach((scene, i) => {
      prompt += `${i + 1}. ${scene.title || 'Untitled'} (${scene.sceneType || 'unknown'})\n`;
      if (scene.purpose) prompt += `   Purpose: ${scene.purpose}\n`;
    });
    prompt += `\n`;
  }

  return prompt;
}

/**
 * Cache context for performance optimization
 */
export async function cacheContext(
  sceneId: string,
  context: HierarchicalContext,
  ttl: number = 3600
): Promise<void> {
  try {
    const cacheKey = `context:${sceneId}`;
    const expires = Date.now() + (ttl * 1000);
    contextCache.set(cacheKey, { data: context, expires });
  } catch (error) {
    // Fail silently - caching is optional
    console.warn('Failed to cache context:', error);
  }
}

/**
 * Invalidate cached context
 */
export async function invalidateContextCache(
  sceneId: string,
  options: { invalidateHierarchy?: boolean } = {}
): Promise<void> {
  try {
    const cacheKey = `context:${sceneId}`;
    contextCache.delete(cacheKey);

    if (options.invalidateHierarchy) {
      // In a real implementation, this would clear related cache entries
      // For now, just clear all cache entries as a simple approach
      contextCache.clear();
    }
  } catch (error) {
    console.warn('Failed to invalidate context cache:', error);
  }
}

/**
 * HierarchicalContextManager class for managing context with caching
 */
export class HierarchicalContextManager {
  private config: {
    cacheEnabled: boolean;
    defaultTTL: number;
    maxCacheSize: number;
  };

  private inFlightRequests = new Map<string, Promise<HierarchicalContext>>();

  constructor(config: Partial<HierarchicalContextManager['config']> = {}) {
    this.config = {
      cacheEnabled: true,
      defaultTTL: 3600,
      maxCacheSize: 100,
      ...config
    };
  }

  async getContext(sceneId: string, options: ContextOptions = {}): Promise<HierarchicalContext> {
    const cacheKey = `context:${sceneId}`;

    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = contextCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return cached.data;
      }
    }

    // Check for in-flight requests to avoid duplicate calls
    if (this.inFlightRequests.has(sceneId)) {
      return this.inFlightRequests.get(sceneId)!;
    }

    // Create new request
    const request = buildFullContext(sceneId, options);
    this.inFlightRequests.set(sceneId, request);

    try {
      const context = await request;

      // Cache the result
      if (this.config.cacheEnabled) {
        await cacheContext(sceneId, context, this.config.defaultTTL);
      }

      return context;
    } finally {
      this.inFlightRequests.delete(sceneId);
    }
  }

  async generatePrompt(sceneId: string, options: ContextOptions = {}): Promise<string> {
    const context = await this.getContext(sceneId, options);
    return generateContextPrompt(context, options);
  }

  async invalidateCache(sceneId: string, options: { invalidateHierarchy?: boolean } = {}): Promise<void> {
    await invalidateContextCache(sceneId, options);
  }

  clearCache(): void {
    contextCache.clear();
    this.inFlightRequests.clear();
  }
}

// Helper functions for context enhancement
function calculateChapterProgression(context: HierarchyContext): number {
  // Simple calculation based on scene count and word count
  const scenes = context.chapter.scenes || [];
  const currentSceneIndex = scenes.findIndex(s => s.id === context.scene.current?.id);
  return currentSceneIndex >= 0 ? Math.round((currentSceneIndex / scenes.length) * 100) : 0;
}

function extractCharacterArcs(context: HierarchyContext): CharacterArc[] {
  // Extract character arcs from story context
  if (context.story.characterArcs && Array.isArray(context.story.characterArcs)) {
    return context.story.characterArcs;
  }
  return [];
}

function extractCharacterProfiles(context: HierarchyContext): Character[] {
  // Extract character profiles from various sources
  const profiles: Character[] = [];
  
  // Get characters from current scene
  const charactersPresent = context.scene.current?.charactersPresent || [];
  charactersPresent.forEach(charName => {
    if (typeof charName === 'string') {
      profiles.push({
        name: charName,
        background: 'Character details to be developed',
        personality: 'Personality to be defined',
        goals: 'Goals to be established'
      });
    }
  });

  return profiles;
}

function extractPlotStructure(context: HierarchyContext): PlotStructure {
  // Extract plot structure from story context
  if (context.story.plotStructure && typeof context.story.plotStructure === 'object') {
    return context.story.plotStructure as PlotStructure;
  }
  
  return {
    act1: 'Setup and inciting incident',
    act2: 'Rising action and complications',
    act3: 'Climax and resolution'
  };
}

function applyContextDepth(context: HierarchicalContext, depth: string): HierarchicalContext {
  switch (depth) {
    case 'minimal':
      return {
        ...context,
        story: {
          ...context.story,
          characterProfiles: [],
          worldSettings: null
        }
      };
    case 'standard':
      return {
        ...context,
        story: {
          ...context.story,
          characterProfiles: context.story.characterProfiles?.slice(0, 3) || []
        }
      };
    default:
      return context;
  }
}
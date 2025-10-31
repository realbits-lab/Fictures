/**
 * Novel Generation Orchestrator
 *
 * Coordinates the complete novel generation pipeline using the Adversity-Triumph Engine.
 * Executes all 9 phases sequentially and provides progress callbacks.
 *
 * Pipeline:
 * 1. Story Summary - Generate story foundation and moral framework
 * 2. Characters - Expand character profiles with detailed arcs
 * 3. Settings - Create immersive locations with adversity elements
 * 4. Parts - Generate 3-act structure with macro character arcs
 * 5. Chapters - Create chapter structure with micro-arcs
 * 6. Scene Summaries - Break down chapters into scene outlines
 * 7. Scene Content - Generate full narrative content for each scene
 * 8. Scene Evaluation - Evaluate and improve scene quality
 * 9. Images - Generate character portraits, setting visuals, and scene images
 */

import { nanoid } from 'nanoid';
import { generateJSON } from './ai-client';
import type {
  StoryGenerationContext,
  StorySummaryResult,
  CharacterGenerationResult,
  SettingGenerationResult,
  PartGenerationResult,
  ChapterGenerationResult,
  SceneSummaryResult,
  SceneContentResult,
  SceneEvaluationResult,
  ImageVariantSet,
} from './types';

export interface NovelGenerationOptions {
  userPrompt: string;
  preferredGenre?: string;
  preferredTone?: 'dark' | 'hopeful' | 'bittersweet' | 'satirical';
  characterCount?: number;
  settingCount?: number;
  partsCount?: number;
  chaptersPerPart?: number;
  scenesPerChapter?: number;
  language?: string;
}

export type ProgressPhase =
  | 'story_summary_start'
  | 'story_summary_complete'
  | 'characters_start'
  | 'characters_progress'
  | 'characters_complete'
  | 'settings_start'
  | 'settings_progress'
  | 'settings_complete'
  | 'parts_start'
  | 'parts_progress'
  | 'parts_complete'
  | 'chapters_start'
  | 'chapters_progress'
  | 'chapters_complete'
  | 'scene_summaries_start'
  | 'scene_summaries_progress'
  | 'scene_summaries_complete'
  | 'scene_content_start'
  | 'scene_content_progress'
  | 'scene_content_complete'
  | 'scene_evaluation_start'
  | 'scene_evaluation_progress'
  | 'scene_evaluation_complete'
  | 'images_start'
  | 'images_progress'
  | 'images_complete'
  | 'complete'
  | 'error';

export interface ProgressData {
  phase: ProgressPhase;
  message?: string;
  data?: any;
  error?: string;
  percentage?: number;
  currentItem?: number;
  totalItems?: number;
}

export type ProgressCallback = (progress: ProgressData) => void | Promise<void>;

/**
 * Generate a complete novel using the Adversity-Triumph Engine
 */
export async function generateCompleteNovel(
  options: NovelGenerationOptions,
  onProgress: ProgressCallback
): Promise<{
  storyId: string;
  story: any;
  characters: any[];
  settings: any[];
  parts: any[];
  chapters: any[];
  scenes: any[];
}> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  try {
    // Phase 1: Story Summary
    await onProgress({
      phase: 'story_summary_start',
      message: 'Generating story foundation and moral framework...',
    });

    const storySummaryResponse = await fetch(`${baseUrl}/studio/api/generation/story-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userPrompt: options.userPrompt,
        preferredGenre: options.preferredGenre,
        preferredTone: options.preferredTone,
        characterCount: options.characterCount || 3,
        settingCount: options.settingCount || 3,
        partsCount: options.partsCount || 3,
        chaptersPerPart: options.chaptersPerPart || 3,
        scenesPerChapter: options.scenesPerChapter || 6,
      } as StoryGenerationContext),
    });

    if (!storySummaryResponse.ok) {
      const error = await storySummaryResponse.json();
      throw new Error(`Story summary generation failed: ${error.details || error.error}`);
    }

    const storySummary: StorySummaryResult = await storySummaryResponse.json();

    await onProgress({
      phase: 'story_summary_complete',
      message: 'Story foundation created',
      data: { storySummary },
    });

    // Phase 2: Characters
    const totalCharacters = storySummary.characters.length;
    await onProgress({
      phase: 'characters_start',
      message: `Expanding ${totalCharacters} character profiles...`,
      data: { totalCharacters },
    });

    // Show initial progress
    console.log('[Orchestrator] Emitting characters_progress (0%)');
    await onProgress({
      phase: 'characters_progress',
      message: `Generating characters...`,
      data: {
        currentCharacter: 0,
        totalCharacters,
        percentage: 0,
      },
    });

    const charactersResponse = await fetch(`${baseUrl}/studio/api/generation/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storySummary }),
    });

    if (!charactersResponse.ok) {
      const error = await charactersResponse.json();
      throw new Error(`Character generation failed: ${error.details || error.error}`);
    }

    const characters: CharacterGenerationResult[] = await charactersResponse.json();

    // Show completion progress
    console.log(`[Orchestrator] Emitting characters_progress (100%) - ${characters.length} characters`);
    await onProgress({
      phase: 'characters_progress',
      message: `Generated ${characters.length} characters (100%)`,
      data: {
        currentCharacter: characters.length,
        totalCharacters: characters.length,
        percentage: 100,
      },
    });

    await onProgress({
      phase: 'characters_complete',
      message: `${characters.length} characters created`,
      data: { characters, totalCharacters: characters.length },
    });

    // Phase 3: Settings
    const expectedSettings = options.settingCount || 3;
    await onProgress({
      phase: 'settings_start',
      message: `Creating ${expectedSettings} immersive story settings...`,
      data: { totalSettings: expectedSettings },
    });

    // Show initial progress
    console.log('[Orchestrator] Emitting settings_progress (0%)');
    await onProgress({
      phase: 'settings_progress',
      message: `Generating settings...`,
      data: {
        currentSetting: 0,
        totalSettings: expectedSettings,
        percentage: 0,
      },
    });

    const settingsResponse = await fetch(`${baseUrl}/studio/api/generation/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storySummary,
        settingCount: expectedSettings,
      }),
    });

    if (!settingsResponse.ok) {
      const error = await settingsResponse.json();
      throw new Error(`Settings generation failed: ${error.details || error.error}`);
    }

    const settings: SettingGenerationResult[] = await settingsResponse.json();

    // Show completion progress
    console.log(`[Orchestrator] Emitting settings_progress (100%) - ${settings.length} settings`);
    await onProgress({
      phase: 'settings_progress',
      message: `Generated ${settings.length} settings (100%)`,
      data: {
        currentSetting: settings.length,
        totalSettings: settings.length,
        percentage: 100,
      },
    });

    await onProgress({
      phase: 'settings_complete',
      message: `${settings.length} settings created`,
      data: { settings, totalSettings: settings.length },
    });

    // Phase 4: Parts
    const expectedParts = options.partsCount || 3;
    await onProgress({
      phase: 'parts_start',
      message: `Structuring ${expectedParts}-act story framework...`,
      data: { totalParts: expectedParts },
    });

    // Show initial progress
    console.log('[Orchestrator] Emitting parts_progress (0%)');
    await onProgress({
      phase: 'parts_progress',
      message: `Generating parts...`,
      data: {
        currentPart: 0,
        totalParts: expectedParts,
        percentage: 0,
      },
    });

    const partsResponse = await fetch(`${baseUrl}/studio/api/generation/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storySummary,
        characters,
        partsCount: expectedParts,
        chaptersPerPart: options.chaptersPerPart || 3,
      }),
    });

    if (!partsResponse.ok) {
      const error = await partsResponse.json();
      throw new Error(`Parts generation failed: ${error.details || error.error}`);
    }

    const parts: PartGenerationResult[] = await partsResponse.json();

    // Show completion progress
    console.log(`[Orchestrator] Emitting parts_progress (100%) - ${parts.length} parts`);
    await onProgress({
      phase: 'parts_progress',
      message: `Generated ${parts.length} acts (100%)`,
      data: {
        currentPart: parts.length,
        totalParts: parts.length,
        percentage: 100,
      },
    });

    await onProgress({
      phase: 'parts_complete',
      message: `${parts.length} acts created`,
      data: { parts, totalParts: parts.length },
    });

    // Phase 5: Chapters
    await onProgress({
      phase: 'chapters_start',
      message: 'Generating detailed chapter structure...',
    });

    // Generate chapters for each part
    const allChapters: ChapterGenerationResult[] = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const previousPartChapters = i > 0 ? allChapters.filter(ch => ch.partId === parts[i - 1].id) : [];

      const chaptersResponse = await fetch(`${baseUrl}/studio/api/generation/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          part,
          characters,
          previousPartChapters,
          chaptersPerPart: options.chaptersPerPart || 3
        }),
      });

      if (!chaptersResponse.ok) {
        const error = await chaptersResponse.json();
        throw new Error(`Chapters generation failed for Part ${i + 1}: ${error.details || error.error}`);
      }

      const partChapters: ChapterGenerationResult[] = await chaptersResponse.json();

      // Add unique ID and part reference to each chapter
      const chaptersWithIds = partChapters.map((chapter) => ({
        ...chapter,
        id: nanoid(), // Generate unique ID for chapter
        partId: part.id, // Link to part
      }));

      allChapters.push(...chaptersWithIds);

      const percentage = Math.round(((i + 1) / parts.length) * 100);

      await onProgress({
        phase: 'chapters_progress',
        message: `Generated ${partChapters.length} chapters for Part ${i + 1}/${parts.length}`,
        data: {
          currentPart: i + 1,
          totalParts: parts.length,
          percentage
        },
      });
    }

    const chapters = allChapters;

    await onProgress({
      phase: 'chapters_complete',
      message: `${chapters.length} chapters created across ${parts.length} parts`,
      data: { chapters },
    });

    // Phase 6: Scene Summaries
    await onProgress({
      phase: 'scene_summaries_start',
      message: 'Breaking down chapters into scene outlines...',
    });

    // Generate scene summaries for each chapter
    const allSceneSummaries: SceneSummaryResult[] = [];
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];

      const sceneSummariesResponse = await fetch(`${baseUrl}/studio/api/generation/scene-summaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter,
          characters,
          settings,
          scenesPerChapter: options.scenesPerChapter || 6
        }),
      });

      if (!sceneSummariesResponse.ok) {
        const error = await sceneSummariesResponse.json();
        throw new Error(`Scene summaries generation failed for Chapter ${i + 1}: ${error.details || error.error}`);
      }

      const chapterSceneSummaries: SceneSummaryResult[] = await sceneSummariesResponse.json();

      // Add chapterId and unique ID to each scene summary
      const sceneSummariesWithChapterId = chapterSceneSummaries.map((sceneSummary, sceneIndex) => ({
        ...sceneSummary,
        id: nanoid(), // Generate unique ID for scene
        chapterId: chapter.id, // Link to chapter
      }));

      allSceneSummaries.push(...sceneSummariesWithChapterId);

      const percentage = Math.round(((i + 1) / chapters.length) * 100);

      await onProgress({
        phase: 'scene_summaries_progress',
        message: `Generated ${chapterSceneSummaries.length} scene outlines for Chapter ${i + 1}/${chapters.length}`,
        data: {
          currentChapter: i + 1,
          totalChapters: chapters.length,
          percentage
        },
      });
    }

    const sceneSummaries = allSceneSummaries;

    await onProgress({
      phase: 'scene_summaries_complete',
      message: `${sceneSummaries.length} scene outlines created across ${chapters.length} chapters`,
      data: { sceneSummaries },
    });

    // Phase 7: Scene Content
    await onProgress({
      phase: 'scene_content_start',
      message: `Generating narrative content for ${sceneSummaries.length} scenes...`,
      data: { totalScenes: sceneSummaries.length },
    });

    // Generate content for each scene
    const allScenes: any[] = [];
    for (let i = 0; i < sceneSummaries.length; i++) {
      const sceneSummary = sceneSummaries[i];

      // Find the chapter this scene belongs to
      const chapter = chapters.find(ch => ch.id === sceneSummary.chapterId);
      if (!chapter) {
        throw new Error(`Chapter not found for scene ${i + 1}`);
      }

      const sceneContentResponse = await fetch(`${baseUrl}/studio/api/generation/scene-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneSummary,
          characters,
          settings,
          chapterContext: {
            title: chapter.title,
            summary: chapter.summary,
            virtueType: chapter.virtueType
          },
          storyContext: {
            genre: storySummary.genre,
            tone: storySummary.targetAudience,
            moralFramework: storySummary.moralFramework.title
          }
        }),
      });

      if (!sceneContentResponse.ok) {
        const error = await sceneContentResponse.json();
        throw new Error(`Scene content generation failed for Scene ${i + 1}: ${error.details || error.error}`);
      }

      const sceneContent: any = await sceneContentResponse.json();

      // Merge scene summary with scene content for complete scene data
      const completeScene = {
        ...sceneSummary, // Includes id, chapterId, title, summary, cyclePhase, emotionalBeat, etc.
        ...sceneContent,  // Includes content, wordCount, emotionalTone
      };

      allScenes.push(completeScene);

      // Calculate percentage for progress
      const percentage = Math.round(((i + 1) / sceneSummaries.length) * 100);

      await onProgress({
        phase: 'scene_content_progress',
        message: `Generated content for scene ${i + 1}/${sceneSummaries.length}`,
        data: {
          completedScenes: i + 1,
          totalScenes: sceneSummaries.length,
          currentScene: i + 1,
          percentage
        },
      });
    }

    const scenes = allScenes;

    await onProgress({
      phase: 'scene_content_complete',
      message: `${scenes.length} scenes written`,
      data: { completedScenes: scenes.length },
    });

    // Phase 8: Scene Evaluation (handled within scene-content API)
    await onProgress({
      phase: 'scene_evaluation_start',
      message: 'Evaluating scene quality...',
    });

    await onProgress({
      phase: 'scene_evaluation_complete',
      message: 'All scenes evaluated and improved',
    });

    // Phase 9: Images - handled by main API route after database creation
    // (needs actual storyId from database)

    // Generation complete
    const result = {
      storyId: 'generated', // Will be created by the API route
      story: {
        title: chapters[0]?.title || 'Untitled Story',
        genre: storySummary.genre,
        tone: storySummary.tone,
        summary: storySummary.summary,
        moralFramework: storySummary.moralFramework,
      },
      characters,
      settings,
      parts,
      chapters,
      scenes,
    };

    await onProgress({
      phase: 'complete',
      message: 'Story generation complete!',
      data: result,
    });

    return result;
  } catch (error) {
    await onProgress({
      phase: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}
